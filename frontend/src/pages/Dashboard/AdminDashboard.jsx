import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function AdminDashboard() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections');
        setElections(data);
      } catch {
        setError('Unable to load elections.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Admin command center</p>
        <h1>Admin Dashboard</h1>
        <p>Manage elections, candidates, registration review, and bulk user operations.</p>
      </header>

      <div className="page-actions" style={{ marginBottom: '18px' }}>
        <Link to="create" className="btn">Create Election</Link>
        <Link to="approvals" className="btn btn-secondary">Review User Registration</Link>
        <Link to="bulk-users" className="btn btn-secondary">Bulk Add User</Link>
      </div>

      {loading && <p className="empty-state">Loading elections...</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {elections.length === 0 && !loading ? (
          <p className="empty-state">No elections created yet.</p>
        ) : (
          elections.map((election) => (
            <Card key={election._id} title={election.title} className="election-card">
              <p>{election.description || 'No description provided.'}</p>
              <p>
                <strong>Window:</strong> {new Date(election.startDate).toLocaleString()} to{' '}
                {new Date(election.endDate).toLocaleString()}
              </p>
              <span className="badge badge-info">{election.status || 'Configured'}</span>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
