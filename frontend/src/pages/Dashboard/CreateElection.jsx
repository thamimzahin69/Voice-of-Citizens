import { useState } from 'react';
import apiClient from '../../api/apiClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function CreateElection() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const { data } = await apiClient.post('/elections', form);
      setMessage({ type: 'success', text: `Election created: ${data.title}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message ?? 'Could not create election.' });
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Create Election</h1>
        <p>Define the election window and description. Only admins can create elections.</p>
      </header>
      <form className="form-stack" onSubmit={handleSubmit}>
        <Input
          label="Election title"
          name="title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
        <label className="form-field">
          <span className="form-label">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="form-input"
            required
          />
        </label>
        <Input
          label="Start date"
          name="startDate"
          type="datetime-local"
          value={form.startDate}
          onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
          required
        />
        <Input
          label="End date"
          name="endDate"
          type="datetime-local"
          value={form.endDate}
          onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          required
        />
        <Button type="submit">Create election</Button>
      </form>
      {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'}>{message.text}</p>}
    </section>
  );
}
