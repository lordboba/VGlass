import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import GlassLogo from './GlassLogo.png'; // Importing the uploaded logo

function App() {
  const [input, setInput] = useState('');
  const [articles, setArticles] = useState([]); // Store fetched articles
  const [outputs, setOutputs] = useState([]); // Store user inputs
  const [error, setError] = useState(''); // Error message state
  const [promptP, setPrompt] = useState(''); //prompt state
  const [metaAnalysisVisible, setMetaAnalysisVisible] = useState(false); // Meta-analysis text box visibility
  const [showConfirmClear, setShowConfirmClear] = useState(false); // Confirmation for clearing inputs
  const [loading, setLoading] = useState(false); // Loading state
  const [showNoArticlesWarning, setShowNoArticlesWarning] = useState(false); // Warning for no articles checked
  const [showConfirmNewQuestion, setShowConfirmNewQuestion] = useState(false); // Confirmation for new question
  const [pdfUrl, setPdfUrl] = useState(null); // Add this state variable with the other useState declarations
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFetchArticles = async (prompt) => {
    try {
      setLoading(true); // Show loading indicator
      const apiUrl = 'https://meta-analysis-ca9ad5868390.herokuapp.com/api/scrape-articles';
      const payload = { prompt };

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

      setArticles(response.data); // Update articles state with the response data
      setOutputs([...outputs, prompt]); // Add the input to the outputs list
      setError(''); // Clear any previous errors
    } catch (err) {
      setError('Error fetching articles. Please try again.');
      console.error(err);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };
  const generateAnalysis = async (article_links) => {
    try {
      setLoading(true);
      setProgress(0);
      setStatusMessage('Starting analysis...');
      
      const apiUrl = 'https://meta-analysis-ca9ad5868390.herokuapp.com/api/start-analysis';
      const payload = { article_links };
      // Start the analysis
      const startResponse = await axios.post(apiUrl, payload);
      const { task_id } = startResponse.data;
      
      // Poll for results
      const checkStatus = async () => {
        try {
          const response = await axios.get(
            `https://meta-analysis-ca9ad5868390.herokuapp.com/api/check-analysis/${task_id}`
          );
          
          // If response is JSON, update progress
          if (response.headers['content-type'].includes('application/json')) {
            const { status, progress, status_message, error } = response.data;
            
            setProgress(progress);
            setStatusMessage(status_message);
            
            if (status === 'failed') {
              setError(error);
              setLoading(false);
              return true; // Stop polling
            }
            return false; // Continue polling
          }
          
          // If response is PDF, download it
          if (response.headers['content-type'] === 'application/pdf') {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'research_analysis.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setProgress(100);
            setStatusMessage('Analysis complete!');
            setLoading(false);
            return true; // Stop polling
          }
          
          return false;
          
        } catch (error) {
          if (error.response?.status !== 404) {
            setError('Error checking analysis status: ' + error.message);
            setLoading(false);
            return true; // Stop polling
          }
          return false; // Continue polling on 404
        }
      };
      
      // Poll every 3 seconds until complete
      const pollInterval = setInterval(async () => {
        const isComplete = await checkStatus();
        if (isComplete) {
          clearInterval(pollInterval);
        }
      }, 3000);
      
      // Set a timeout to stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
        setError('Analysis timed out after 10 minutes');
      }, 600000);
      
    } catch (error) {
      setError('Failed to start analysis: ' + error.message);
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Input cannot be empty.');
      return;
    }
    if (outputs.length > 0 || articles.length > 0) {
      setShowConfirmNewQuestion(true);
    } else {
      setPrompt(input);
      await handleFetchArticles(input); // Fetch articles from API
      setInput(''); // Clear the input box
    }
  };

  const confirmNewQuestion = async () => {
    setArticles([]);
    setOutputs([]);
    setMetaAnalysisVisible(false);
    await handleFetchArticles(input); // Fetch articles from API
    setInput('');
    setShowConfirmNewQuestion(false);
  };

  const handleClearAll = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl); // Clean up the blob URL
      setPdfUrl(null);
    }
    setOutputs([]);
    setArticles([]);
    setMetaAnalysisVisible(false);
    setShowConfirmClear(false);
  };

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', flexDirection: 'column', position: 'relative' }}>
      {/* Header with Logo */}
      <div style={{ textAlign: 'center', padding: '10px 0', backgroundColor: '#222', color: '#fff' }}>
        <img src={GlassLogo} alt="Glass Logo" style={{ height: '80px' }} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '10px', margin: '0 auto', width: '80%', textAlign: 'center', paddingBottom: '60px' }}>
        <div>
          <h1>Meta-Analysis Generator</h1>
          <p style={{ fontSize: '1rem', color: '#555', marginTop: '10px' }}>
            Ask a research question, choose articles, and we'll generate a meta-analysis.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your research question here"
              rows="4"
              cols="50"
              style={{ borderRadius: '10px', padding: '10px', width: '100%' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="submit"
                style={{ fontSize: '1.2rem', padding: '10px 20px', borderRadius: '10px' }}
              >
                Submit
              </button>
            </div>
          </form>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {loading && <p style={{ color: 'blue', textAlign: 'center' }}>Loading...</p>}
        </div>

        {/* Articles Table */}
        {articles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h2>Fetched Articles</h2>
            <div style={{ marginTop: '10px' }}>
              {articles.map((article, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#222',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '15px',
                    marginBottom: '10px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ marginRight: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id={`item-${index}`}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                  <div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#FFF', textDecoration: 'underline', fontSize: '1.1rem' }}
                    >
                      {article.title}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta-Analysis Button */}
        {articles.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                const checkedArticles = Array.from(
                  document.querySelectorAll('input[type="checkbox"]:checked')
                ).map(checkbox => {
                  // Get the index from the checkbox id
                  const index = parseInt(checkbox.id.split('-')[1], 10);
                  // Return the URL of the checked article
                  return articles[index].url;
                });

                if (checkedArticles.length === 0) {
                  setShowNoArticlesWarning(true);
                } else {
                  setShowNoArticlesWarning(false);
                  setMetaAnalysisVisible(true);
                  generateAnalysis(checkedArticles);
                }
              }}
              style={{ fontSize: '1.2rem', padding: '10px 20px', borderRadius: '10px' }}
            >
              Generate Meta-Analysis
            </button>
            {showNoArticlesWarning && (
              <p style={{ color: 'red', marginTop: '10px' }}>Please select at least one article before generating a meta-analysis.</p>
            )}
          </div>
        )}

        {metaAnalysisVisible && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ width: '80%', padding: '10px', fontSize: '1rem', borderRadius: '10px', textAlign: 'left' }}>
              <p>Generating: {statusMessage}</p>
            </div>
          </div>
        )}

        {metaAnalysisVisible && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ width: '80%', padding: '10px', fontSize: '1rem', borderRadius: '10px', textAlign: 'left' }}>
              <div style={{ width: '100%', backgroundColor: '#f3f3f3', borderRadius: '10px', overflow: 'hidden' }}>
                
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setShowConfirmClear(true)}
                style={{ fontSize: '1.2rem', padding: '10px 20px', borderRadius: '10px' }}
              >
                Clear All Inputs
              </button>
            </div>
          </div>
        )}

        {/* Clear All Confirmation Dialog */}
        {showConfirmClear && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#222',
              padding: '20px',
              boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
              borderRadius: '10px',
              border: '1px solid #F9F9F9',
              textAlign: 'center',
            }}
          >
            <p>Are you sure you want to clear all inputs?</p>
            <button onClick={handleClearAll} style={{ marginRight: '10px' }}>Yes</button>
            <button onClick={() => setShowConfirmClear(false)}>No</button>
          </div>
        )}

        {/* New Question Confirmation Dialog */}
        {showConfirmNewQuestion && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#222',
              padding: '20px',
              boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
              borderRadius: '10px',
              border: '1px solid #F9F9F9',
              textAlign: 'center',
            }}
          >
            <p>Submitting a new question will clear all existing inputs and articles. Do you want to continue?</p>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={confirmNewQuestion}
                style={{ marginRight: '10px', padding: '10px 20px', fontSize: '1rem', borderRadius: '10px' }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmNewQuestion(false)}
                style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '10px' }}
              >
                No
              </button>
            </div>
          </div>
        )}

      
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          color: '#fff',
          backgroundColor: '#333',
          padding: '10px 0',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
        }}
      >
        Developed by Tyler Xiao and Daniel Tritasavit
      </div>
    </div>
  );
}

export default App;
