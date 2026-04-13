import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { completeProfile } = useAuth();
  const [form, setForm] = useState({ password: '', nid: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.password || !form.nid) {
      setError('Password and NID are required.');
      return;
    }

    const formData = new FormData();
    formData.append('password', form.password);
    formData.append('nid', form.nid);
    if (documentFile) {
      formData.append('document', documentFile);
    }

    setLoading(true);

    try {
      await completeProfile(formData);
      setSuccess('Profile completed successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard/overview'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete your profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page auth-page">
      <h1>Complete Your Profile</h1>
      <p>Please set a new password, enter your NID, and upload your document.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="New password"
          name="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        <Input
          label="NID"
          name="nid"
          value={form.nid}
          onChange={(e) => setForm((prev) => ({ ...prev, nid: e.target.value }))}
          required
        />

        <div className="form-field">
          <label className="form-label">Upload document</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <Button type="submit" className={loading ? 'disabled' : ''}>
          {loading ? 'Submitting…' : 'Complete profile'}
        </Button>
      </form>
    </main>
  );
}
