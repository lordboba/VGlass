import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER

def generate_analysis(article_links):
    """
    Generates a comprehensive analysis using Google Gemini API for multiple research articles.
    
    Args:
        article_links (list): List of URLs to research articles
    
    Returns:
        str: Combined analysis including abstract, literature review, data analysis,
             results, conclusion, and references
    """
    #data = request.get_json()
    #article_links = data.get('article_links', [])
    # Format article links for prompt
    formatted_links = "\n".join([f"- {link}" for link in article_links])
    
    # Define prompts for each section
    prompts = {
        "abstract": f"Given these research articles:\n{formatted_links}\n\nGenerate only a comprehensive abstract (250-300 words) that synthesizes the main findings and implications.",
        
        "literature_review": f"Based on these articles:\n{formatted_links}\n\nWrite only a detailed literature review (800-1000 words) that critically analyzes and connects the existing research.",
        
        "data_analysis": f"For these articles:\n{formatted_links}\n\nProvide only a thorough data analysis section (600-800 words) that examines the methodologies and data collection approaches used.",
        
        "results": f"Analyzing these articles:\n{formatted_links}\n\nSynthesize the key results and findings (500-700 words) across all papers.",
        
        "conclusion": f"Based on these articles:\n{formatted_links}\n\nWrite only a conclusion (400-500 words) that summarizes the main insights and suggests future research directions.",
        
        "references": f"For these articles:\n{formatted_links}\n\nGenerate a properly formatted reference list in APA style."
    }
    
    # Initialize Gemini model
    genai.configure(api_key="AIzaSyCOmwXnskUW7wqfA5WZptgdWYAojSuRUL0")

    # Create the model
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

    # Generate each section
    sections = {}
    for section_name, prompt in prompts.items():
        try:
            response = model.generate_content(prompt)
            sections[section_name] = response.text
        except Exception as e:
            sections[section_name] = f"Error generating {section_name}: {str(e)}"
    
    # Combine all sections into final analysis
    sections_data = {
        'title': "Research Analysis",
        'sections': [
            {'heading': "Abstract", 'content': sections['abstract']},
            {'heading': "Literature Review", 'content': sections['literature_review']},
            {'heading': "Data Analysis", 'content': sections['data_analysis']},
            {'heading': "Results", 'content': sections['results']},
            {'heading': "Conclusion", 'content': sections['conclusion']},
            {'heading': "References", 'content': sections['references']}
        ]
    }
    
    # Generate PDF
    output_path = "research_analysis.pdf"
    generate_pdf(sections_data, output_path)
    
    # Return the PDF file instead of the path
    return "hi"

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

article_links = [
    "https://research.wur.nl/en/publications/sustainability-of-banana-based-agroecosystems-affected-by-xanthom",
    "https://doi.org/10.29321/maj.10.a04230",
    "https://www.taylorfrancis.com/chapters/mono/10.1201/b10514-12/major-diseases-banana-abdou-tenkouano-michael-pillay",
    "https://plantwiseplusknowledgebank.org/doi/10.1079/pwkb.20167801443",
    "https://medwinpublishers.com/OAJMB/OAJMB16000134.pdf",
    # ... more links ...
]
analysis = generate_analysis(article_links)
print(analysis)