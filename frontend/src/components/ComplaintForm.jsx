import { useState } from 'react';
import apiClient from '../api/apiClient';

export default function ComplaintForm() {
  const [form, setForm] = useState({
    subject: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.subject || !form.description) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiClient.post('/complaints', {
        subject: form.subject,
        description: form.description,
      });
      
      setMessage('Complaint submitted successfully!');
      setForm({ subject: '', description: '' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>Submit a Complaint</h1>
        <p>Tell us if you've experienced any issues or have concerns to report.</p>
      </header>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="subject" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333',
            }}>
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Briefly describe your complaint"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label htmlFor="description" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333',
            }}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Provide detailed information about your complaint"
              rows="6"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#5568d3')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#667eea')}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>

          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '4px',
              backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
              color: message.includes('successfully') ? '#155724' : '#721c24',
              fontSize: '14px',
              marginTop: '8px',
            }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}