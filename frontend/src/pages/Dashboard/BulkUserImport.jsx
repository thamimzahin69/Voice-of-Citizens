import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function BulkUserImport() {
  const [file, setFile] = useState(null);
  const [defaultRole, setDefaultRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultRole', defaultRole);
    setLoading(true);

    try {
      const { data } = await apiClient.post('/admin/users/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to upload CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Admin import</p>
        <h1>Bulk Add User</h1>
        <p>Upload a CSV file to add multiple voters or administrators in one step.</p>
      </header>

      <div className="page-actions" style={{ marginBottom: '18px' }}>
        <Button type="button" onClick={() => navigate('/dashboard/admin')} className="btn-secondary">
          Back to Admin Dashboard
        </Button>
      </div>

      <Card className="wide-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">CSV upload input</span>
            <input className="form-input" type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>

          <div className="form-field">
            <span className="form-label">Default user type</span>
            <label><input type="radio" name="defaultRole" value="user" checked={defaultRole === 'user'} onChange={() => setDefaultRole('user')} /> Voter user</label>
            <label><input type="radio" name="defaultRole" value="admin" checked={defaultRole === 'admin'} onChange={() => setDefaultRole('admin')} /> Admin user</label>
          </div>

          <div className="notice">
            <strong>Please review the CSV carefully before uploading.</strong>
            <br />
            Example CSV columns: <code>name,email,nid,role,area</code>
            <br />
            Example row: <code>John Doe,john@example.com,1234567890,user,Dhaka North</code>
          </div>

          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload CSV'}</Button>
        </form>
      </Card>

      {result && (
        <section className="card" style={{ marginTop: '18px' }}>
          <h2>Import status</h2>
          <p>{result.message}</p>
          <div className="stat-grid">
            <div className="stat-card"><strong className="stat-value">{result.created?.length || 0}</strong><span className="stat-label">Created</span></div>
            <div className="stat-card"><strong className="stat-value">{result.errors?.length || 0}</strong><span className="stat-label">Errors</span></div>
          </div>
        </section>
      )}
    </section>
  );
}
