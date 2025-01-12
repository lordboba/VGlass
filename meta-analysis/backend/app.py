from threading import Thread
import uuid
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
import os
app = Flask(__name__)
CORS(app)  # Enable CORS to allow communication between frontend and backend
temp = "wassup"
# Define the scrape_articles function
def scrape_articles(prompt):
    # print("biden")
    url = "https://api.crossref.org/works"
    params = {"query": prompt, "rows": 12}
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        articles = []
        for item in data.get("message", {}).get("items", []):
            title = item.get("title", ["No Title"])[0]
            doi = item.get("DOI", "No DOI")
            url = f"https://doi.org/{doi}" if doi != "No DOI" else "No URL"
            articles.append({"title": title, "doi": doi, "url": url})
        return articles
    except requests.exceptions.RequestException as e:
        print(f"Error fetching articles: {e}")
        return []

# Define API route
@app.route('/api/scrape-articles', methods=['POST'])
def get_articles():
    data = request.get_json()
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    articles = scrape_articles(prompt)
    return jsonify(articles)


tasks = {}

def process_analysis_task(task_id, article_links):
    try:
        # Update progress: Setup (10%)
        tasks[task_id]['progress'] = 10
        tasks[task_id]['status_message'] = "Initializing analysis..."
        
        # Initialize Gemini model
        genai.configure(api_key="AIzaSyCOmwXnskUW7wqfA5WZptgdWYAojSuRUL0")
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=generation_config,
        )

        formatted_links = "\n".join([f"- {link}" for link in article_links])
        
        # Your existing prompts dictionary with the new "gaps" section
        prompts = {
            "abstract": f"Given these research articles:\n{formatted_links}\n\nGenerate only a comprehensive abstract (250-300 words) that synthesizes the main findings and implications. Use academic language only.",
            "literature_review": f"Based on these articles:\n{formatted_links}\n\nWrite only a detailed literature review (800-1000 words) that critically analyzes and connects the existing research. Use academic language only.",
            "data_analysis": f"For these articles:\n{formatted_links}\n\nProvide only a thorough data analysis section (600-800 words) that examines the methodologies and data collection approaches used. Use academic language only.",
            "results": f"Analyzing these articles:\n{formatted_links}\n\nSynthesize the key results and findings (500-700 words) across all papers. Use academic language only.",
            "gaps": f"Based on these articles:\n{formatted_links}\n\nIdentify only the gaps in the current research (300-500 words) and suggest areas for further investigation. Use academic language only.",
            "conclusion": f"Based on these articles:\n{formatted_links}\n\nWrite only a conclusion (400-500 words) that summarizes the main insights and suggests future research directions. Use academic language only.",
            "references": f"For these articles:\n{formatted_links}\n\nGenerate a properly formatted reference list in APA style. Use academic language only."
        }

        # Generate each section with progress updates
        sections = {}
        progress_per_section = 70 / len(prompts)  # 70% of progress for content generation
        
        for i, (section_name, prompt) in enumerate(prompts.items()):
            try:
                tasks[task_id]['status_message'] = f"Generating {section_name.replace('_', ' ').title()}..."
                response = model.generate_content(prompt)
                sections[section_name] = response.text
                
                # Update progress (10% initial + 70% for generation + 20% for PDF)
                current_progress = 10 + (progress_per_section * (i + 1))
                tasks[task_id]['progress'] = int(current_progress)
                
            except Exception as e:
                sections[section_name] = f"Error generating {section_name}: {str(e)}"

        # Update progress: PDF Generation (90%)
        tasks[task_id]['progress'] = 90
        tasks[task_id]['status_message'] = "Generating PDF..."
        s2 = {}
        for s in sections:
            s2[s] = "\n".join(x for x in sections[s].splitlines() if "Okay," not in x)
        # Combine sections and generate PDF
        sections_data = {
            'title': "Research Analysis",
            'sections': [
                {'heading': "Abstract", 'content': s2['abstract']},
                {'heading': "Literature Review", 'content': s2['literature_review']},
                {'heading': "Data Analysis", 'content': s2['data_analysis']},
                {'heading': "Results", 'content': s2['results']},
                {'heading': "Gaps", 'content': s2['gaps']},
                {'heading': "Conclusion", 'content': s2['conclusion']},
                {'heading': "References", 'content': s2['references']}
            ]
        }
        
        output_path = f"research_analysis_{task_id}.pdf"
        generate_pdf(sections_data, output_path)
        
        # Update final status
        tasks[task_id].update({
            'status': 'completed',
            'file_path': output_path,
            'progress': 100,
            'status_message': "Analysis complete!"
        })

    except Exception as e:
        tasks[task_id].update({
            'status': 'failed',
            'error': str(e),
            'status_message': f"Error: {str(e)}"
        })

@app.route('/api/start-analysis', methods=['POST'])
def start_analysis():
    data = request.get_json()
    article_links = data.get('article_links', [])

    if not article_links:
        return jsonify({'error': 'No article links provided'}), 400
    
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        'status': 'processing',
        'file_path': None,
        'error': None,
        'progress': 0,
        'status_message': 'Starting analysis...'
    }
    
    thread = Thread(target=process_analysis_task, args=(task_id, article_links))
    thread.daemon = True
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/api/check-analysis/<task_id>', methods=['GET'])
def check_analysis(task_id):
    if task_id not in tasks:
        return jsonify({'status': 'not_found'}), 404
    
    task = tasks[task_id]
    
    if task['status'] == 'completed':
        try:
            return send_file(
                task['file_path'],
                mimetype='application/pdf',
                as_attachment=True,
                download_name='research_analysis.pdf'
            )
        finally:
            if os.path.exists(task['file_path']):
                os.remove(task['file_path'])
            del tasks[task_id]
    
    return jsonify({
        'status': task['status'],
        'progress': task['progress'],
        'status_message': task['status_message'],
        'error': task['error']
    })

def generate_pdf(sections_data, output_path):
    """
    Generates a PDF from the analysis sections.
    
    Args:
        sections_data (dict): Dictionary containing title and sections
        output_path (str): Path where PDF will be saved
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Create styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='SectionHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=24
    ))
    styles.add(ParagraphStyle(
        name='CustomBodyText',
        parent=styles['Normal'],
        fontSize=12,
        leading=14,
        alignment=TA_JUSTIFY
    ))
    
    # Build PDF content
    story = []
    
    # Add title
    story.append(Paragraph(sections_data['title'], styles['CustomTitle']))
    story.append(Spacer(1, 12))
    for section in sections_data['sections']:
        story.append(Paragraph(section['heading'], styles['SectionHeading']))
        
        # Split content into paragraphs and add them
        paragraphs = section['content'].split('\n\n')
        for para in paragraphs:
            if para.strip():
                story.append(Paragraph(para, styles['CustomBodyText'])) 
                story.append(Spacer(1, 12))
    
    # Generate PDF
    doc.build(story)



if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
