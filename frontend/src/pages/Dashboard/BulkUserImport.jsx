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
      const message = err?.response?.data?.message || 'Unable to upload CSV. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Bulk Add Users</h1>
        <p>Upload a CSV file and add multiple voters or admin users in one step.</p>
      </header>

      <div className="page-actions">
        <Button type="button" onClick={() => navigate('/dashboard/admin')} className="secondary">
          Back to Admin Dashboard
        </Button>
      </div>

      <Card className="wide-card">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>

          <div className="form-field">
            <span className="form-label">Default user type</span>
            <label className="radio-field">
              <input
                type="radio"
                name="defaultRole"
                value="user"
                checked={defaultRole === 'user'}
                onChange={() => setDefaultRole('user')}
              />
              Voter user
            </label>
            <label className="radio-field">
              <input
                type="radio"
                name="defaultRole"
                value="admin"
                checked={defaultRole === 'admin'}
                onChange={() => setDefaultRole('admin')}
              />
              Admin user
            </label>
          </div>

          <div className="notice">
            <strong>CSV format:</strong> name,email,doc,role
            <br />
            Example: <code>John Doe,john@example.com,passport.pdf,user</code>
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" className={loading ? 'disabled' : ''}>
            {loading ? 'Uploading…' : 'Upload CSV'}
          </Button>
        </form>
      </Card>

      {result && (
        <section className="result-panel">
          <h2>Import results</h2>
          <p>{result.message}</p>
          <div className="result-summary">
            <p><strong>Created:</strong> {result.created?.length || 0}</p>
            <p><strong>Errors:</strong> {result.errors?.length || 0}</p>
          </div>

          {result.created?.length > 0 && (
            <Card>
              <h3>Created users</h3>
              <ul>
                {result.created.map((user) => (
                  <li key={`${user.email}-${user.tempPassword}`}>
                    {user.email} ({user.role}) — temp password: <code>{user.tempPassword}</code>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.errors?.length > 0 && (
            <Card>
              <h3>Row errors</h3>
              <ul>
                {result.errors.map((errorEntry, index) => (
                  <li key={index}>
                    Row {errorEntry.row}: {errorEntry.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}
    </section>
  );
}
