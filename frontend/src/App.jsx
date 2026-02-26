import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [backendData, setBackendData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch data from your Express backend
    axios.get('http://localhost:5000/api/test')
      .then((response) => {
        setBackendData(response.data)
      })
      .catch((err) => {
        console.error("Error fetching data:", err)
        setError("Could not connect to backend. Is it running?")
      })
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🗳️ Voice of Citizens</h1>
      <h2>Election Management System</h2>
      
      <div style={{ margin: '20px auto', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', maxWidth: '500px' }}>
        <h3>Backend Connection Status:</h3>
        
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : backendData ? (
          <div>
            <p style={{ color: 'green', fontWeight: 'bold' }}>{backendData.message}</p>
            <p><strong>Project:</strong> {backendData.project}</p>
            <p><strong>Status:</strong> {backendData.status}</p>
          </div>
        ) : (
          <p>Loading data from backend...</p>
        )}
      </div>
    </div>
  )
}

export default App