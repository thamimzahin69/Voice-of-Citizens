import { useState } from 'react';
import apiClient from '../api/apiClient';
import Button from './ui/Button';
import Card from './ui/Card';

export default function ComplaintForm() {
  const [form, setForm] = useState({ subject: '', description: '', election: '', attachment: null });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject || !form.description) {
      setMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const payload = new FormData();
      payload.append('subject', form.subject);
      payload.append('description', form.description);
      payload.append('election', form.election);
      if (form.attachment) payload.append('attachment', form.attachment);

      await apiClient.post('/complaints', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Complaint submitted successfully.');
      setForm({ subject: '', description: '', election: '', attachment: null });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Citizen support</p>
        <h1>Complaints</h1>
        <p>Submit a complaint and track election-related concerns through the review process.</p>
      </header>

      <Card className="wide-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">Complaint title *</span>
            <input className="form-input" name="subject" value={form.subject} onChange={handleChange} placeholder="Briefly describe the issue" required />
          </label>
          <label className="form-field">
            <span className="form-label">Related election</span>
            <input className="form-input" name="election" value={form.election} onChange={handleChange} placeholder="Election name or ID, if applicable" />
          </label>
          <label className="form-field">
            <span className="form-label">Description *</span>
            <textarea className="form-input" name="description" value={form.description} onChange={handleChange} rows="6" placeholder="Provide details for the administrator review team" required />
          </label>
          <label className="form-field">
            <span className="form-label">Attachment upload</span>
            <input className="form-input" type="file" onChange={(e) => setForm((prev) => ({ ...prev, attachment: e.target.files?.[0] || null }))} />
          </label>
          <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</Button>
          {message && <p className={message.includes('successfully') ? 'form-success' : 'form-error'}>{message}</p>}
        </form>
      </Card>
    </section>
  );
}
