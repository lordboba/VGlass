import React, { useState } from 'react';
import axios from 'axios';

function ScrapeArticles() {
  const [prompt, setPrompt] = useState('');
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

  const handleFetchArticles = async () => {
    try {
      // Make a POST request to the Flask backend
      const apiUrl = 'http://localhost:8000/scrape-articles'; // API endpoint
      const payload = { prompt };

      // Send POST request with payload
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
                },
      });
  
      // Update the articles state with the response data
      setArticles(response.data);
      setError('');
    } catch (err) {
      // Handle errors
      setError('Error fetching articles. Please try again.');
      console.error(err);
    }
  };
  
  return (
    <div>
      <h1>Academic Article Finder</h1>
      <input
        type="text"
        placeholder="Enter search prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ marginRight: '10px', padding: '5px' }}
      />
      <button onClick={handleFetchArticles} style={{ padding: '5px 10px' }}>
        Fetch Articles
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {articles.map((article, index) => (
          <li key={index}>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ScrapeArticles;
