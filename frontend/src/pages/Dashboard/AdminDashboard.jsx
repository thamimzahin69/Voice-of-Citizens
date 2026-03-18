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
      } catch (err) {
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
        <h1>Admin Dashboard</h1>
        <p>Manage elections, candidates, and ballot settings.</p>
      </header>

      <div className="page-actions">
        <Link to="create" className="btn">
          Create new election
        </Link>
      </div>

      {loading && <p>Loading elections…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {elections.map((election) => (
          <Card key={election._id} title={election.title} className="election-card">
            <p>{election.description}</p>
            <p>
              <strong>Window:</strong> {new Date(election.startDate).toLocaleString()} –{' '}
              {new Date(election.endDate).toLocaleString()}
            </p>
            <Link to={`/dashboard/admin/election/${election._id}`} className="link">
              Manage election
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
