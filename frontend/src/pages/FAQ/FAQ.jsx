import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const fallbackFaqs = [
  { _id: 'register', question: 'How do I register?', answer: 'Create an account using your email, password, NID number, and NID document.' },
  { _id: 'vote-change', question: 'Can I change my vote?', answer: 'Votes are final once cast to keep election records secure and auditable.' },
  { _id: 'approval', question: 'Why is my account pending?', answer: 'Some accounts require administrator review before election access is enabled.' },
];

export default function FAQ() {
  const { isAdmin } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadFaqs() {
      try {
        const { data } = await apiClient.get('/faq');
        setFaqs(data.length ? data : fallbackFaqs);
      } catch {
        setFaqs(fallbackFaqs);
      }
    }

    loadFaqs();
  }, []);

  function startAdd() {
    setEditing('new');
    setForm({ question: '', answer: '' });
  }

  function startEdit(faq) {
    setEditing(faq._id || faq.question);
    setForm({ question: faq.question, answer: faq.answer });
  }

  async function saveFaq(event) {
    event.preventDefault();
    setMessage('');
    try {
      if (editing === 'new') {
        const { data } = await apiClient.post('/faq', form);
        setFaqs((prev) => [data, ...prev]);
      } else {
        const { data } = await apiClient.put(`/faq/${editing}`, form);
        setFaqs((prev) => prev.map((faq) => (faq._id === editing ? data : faq)));
      }
      setEditing(null);
      setForm({ question: '', answer: '' });
      setMessage('FAQ saved successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save FAQ. Please check admin permissions.');
    }
  }

  async function deleteFaq(id) {
    setMessage('');
    try {
      await apiClient.delete(`/faq/${id}`);
      setFaqs((prev) => prev.filter((faq) => faq._id !== id));
      setMessage('FAQ deleted.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not delete FAQ. Please check admin permissions.');
    }
  }

  return (
    <main className="page narrow-page">
      <header className="page-header">
        <p className="page-eyebrow">Help center</p>
        <h1>Frequently Asked Questions</h1>
        <p>Clear answers about registration, voting, complaints, and election administration.</p>
      </header>

      {isAdmin && (
        <div className="page-actions" style={{ marginBottom: '18px' }}>
          <Button type="button" onClick={startAdd}>Add FAQ</Button>
        </div>
      )}

      {editing && isAdmin && (
        <form className="card form-stack" onSubmit={saveFaq} style={{ marginBottom: '18px' }}>
          <Input
            label="Question"
            value={form.question}
            onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
            required
          />
          <label className="form-field">
            <span className="form-label">Answer</span>
            <textarea
              className="form-input"
              rows={4}
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              required
            />
          </label>
          <div className="form-actions">
            <Button type="submit">Save FAQ</Button>
            <Button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {message && <p className={message.includes('Could not') ? 'form-error' : 'form-success'}>{message}</p>}

      <div className="faq-list">
        {faqs.map((faq) => {
          const id = faq._id || faq.question;
          const isOpen = openId === id;
          return (
            <article key={id} className="faq-card">
              <button type="button" className="faq-button" onClick={() => setOpenId(isOpen ? null : id)}>
                <span>{faq.question}</span>
                <span>{isOpen ? 'Collapse' : 'Expand'}</span>
              </button>
              {isOpen && <p className="faq-answer">{faq.answer}</p>}
              {isAdmin && (
                <div className="card-actions">
                  <Button type="button" className="btn-secondary" onClick={() => startEdit(faq)}>Edit</Button>
                  <Button type="button" className="btn-danger" onClick={() => deleteFaq(id)}>Delete</Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
