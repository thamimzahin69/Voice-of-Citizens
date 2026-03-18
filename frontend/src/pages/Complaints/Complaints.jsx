import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Complaints() {
  const [complaint, setComplaint] = useState('');
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/complaints');
        setHistory(data);
      } catch {
        setHistory([]);
      }
    }
    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const { data } = await apiClient.post('/complaints', { text: complaint });
      setStatus({ type: 'success', text: 'Complaint submitted successfully.' });
      setHistory((prev) => [data, ...prev]);
      setComplaint('');
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message ?? 'Failed to submit complaint.' });
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Complaints</h1>
        <p>Submit and track issues related to elections or voter experience.</p>
      </header>

      <section className="complaint-form">
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">Describe your issue</span>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={4}
              className="form-input"
              required
            />
          </label>
          <Button type="submit">Submit complaint</Button>
          {status && <p className={status.type === 'error' ? 'form-error' : 'form-success'}>{status.text}</p>}
        </form>
      </section>

      <section className="complaint-history">
        <h2>Recent complaints</h2>
        {history.length === 0 ? (
          <p>No complaints yet.</p>
        ) : (
          <ul className="complaint-list">
            {history.map((item) => (
              <li key={item._id} className="complaint-item">
                <p>{item.text}</p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
                <span className="status">{item.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
