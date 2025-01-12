#from flask import Flask, request, jsonify, render_template
#from flask_cors import CORS
#import requests

#app = Flask(__name__)
#CORS(app)  # Enable CORS to allow communication between frontend and backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import requests

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Pydantic model for the prompt (used for validation)
class ScrapingRequest(BaseModel):
    prompt: str

# Define the scrape_articles function
def scrape_articles(prompt):
    url = "https://api.crossref.org/works"
    params = {"query": prompt, "rows": 10}
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


#@app.route('/'  )
#def home():
#    return render_template("hello.html",person=name)


# Define API route
@app.post("/scrape-articles/")
async def scrape_articles(request: ScrapingRequest):
    prompt = request.prompt
    # Scraping logic (simulated)
    articles = scrape_articles(prompt)
    return articles
#if __name__ == '__main__':
#    app.run(debug=True)