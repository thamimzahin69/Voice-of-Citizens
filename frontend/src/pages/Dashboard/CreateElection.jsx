import { useState } from 'react';
import apiClient from '../../api/apiClient';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function CreateElection() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    area: '',
    votingType: 'majority',
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
        <p>Define the election window, description, area, and voting type.</p>
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
          label="Area / Constituency"
          name="area"
          value={form.area}
          onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
          required
          placeholder="e.g., City, Region, District"
        />
        <label className="form-field">
          <span className="form-label">Voting Type</span>
          <select
            name="votingType"
            value={form.votingType}
            onChange={(e) => setForm((prev) => ({ ...prev, votingType: e.target.value }))}
            className="form-input"
            required
          >
            <option value="majority">Majority Voting</option>
            <option value="rankBased">Rank Based Voting</option>
          </select>
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
