import React, { useState } from 'react';
import './App.css';
import ScrapeArticles from './components/ScrapeArticles';

function App() {
  const [input, setInput] = useState('');
  const [outputs, setOutputs] = useState([]); // Store a list of outputs
  const [error, setError] = useState(''); // Error message state
  const [metaAnalysisVisible, setMetaAnalysisVisible] = useState(false); // Meta-analysis textbox visibility
  const [showConfirmClear, setShowConfirmClear] = useState(false); // Confirmation for clearing inputs
  const [activeTab, setActiveTab] = useState('metaAnalysis'); // Active tab state

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Input cannot be empty.');
      return;
    }
    setError(''); // Clear any previous error
    setOutputs([...outputs, input]); // Add the new input to the outputs list
    setInput(''); // Clear the input box
  };

  const handleMetaAnalysis = () => {
    setMetaAnalysisVisible(true); // Show the meta-analysis text box
  };

  const handleClearAll = () => {
    setOutputs([]); // Clear all outputs
    setMetaAnalysisVisible(false); // Hide the meta-analysis text box
    setShowConfirmClear(false); // Hide confirmation dialog
  };

  return (
    <div className="App" style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      {/* Sidebar for History */}
      <div
        style={{
          width: '20%',
          backgroundColor: '#222', // Light gray background for visibility
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          borderRight: '1px solid #ccc',
          overflowY: 'auto',
          padding: '10px',
          zIndex: 1000, // Ensure it's above other elements
        }}
      >
        <h3>History</h3>
        <div
          style={{
            border: '5px solid #ddd',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '10px',
          }}
        >
          <p>PDF 1</p>
        </div>
        <div
          style={{
            border: '5px solid #ddd',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
          }}
        >
          <p>PDF 2</p>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: '10px',
          marginLeft: '20%',
          marginRight: '20%', // Leave space for the sidebars
        }}
      >
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
              style={{ borderRadius: '10px', padding: '10px' }}
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
        </div>
        <ScrapeArticles />
        <div
          className="output"
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '20px',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '10px',
          }}
        >
          <h2>Output:</h2>
          <div>
            {outputs.map((item, index) => (
              <div
                key={index}
                className="output-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  padding: '10px',
                  borderRadius: '10px',
                }}
              >
                <input type="checkbox" id={`item-${index}`} style={{ marginRight: '10px' }} />
                <label htmlFor={`item-${index}`}>{item}</label>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleMetaAnalysis}
            style={{ fontSize: '1.2rem', padding: '10px 20px', borderRadius: '10px' }}
          >
            Generate Meta-Analysis
          </button>
        </div>
        {metaAnalysisVisible && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <textarea
              placeholder="Meta-analysis results will appear here..."
              rows="10"
              cols="70"
              style={{ width: '80%', padding: '10px', fontSize: '1rem', borderRadius: '10px' }}
            />
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
        {showConfirmClear && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '20px',
              boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'black' }}>
              Are you sure you want to clear all inputs? This will delete your meta-analysis.
            </p>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={handleClearAll}
                style={{ marginRight: '10px', padding: '10px 20px', fontSize: '1rem', borderRadius: '10px' }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '10px' }}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar for Browser */}
      <div
        style={{
          width: '20%',
          backgroundColor: '#222', // Light gray background for visibility
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          borderLeft: '1px solid #ccc',
          overflowY: 'auto',
          padding: '10px',
          zIndex: 1000, // Ensure it's above other elements
        }}
      >
        <h3>Browser</h3>
        <div
          style={{
            border: '5px solid #ddd',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '10px',
          }}
        >
          <p>PDF A</p>
        </div>
        <div
          style={{
            border: '5px solid #ddd',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
          }}
        >
          <p>PDF B</p>
        </div>
      </div>
    </div>
  );
}

export default App;
