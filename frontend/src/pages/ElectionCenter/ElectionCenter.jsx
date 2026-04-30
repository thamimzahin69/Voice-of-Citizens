import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function ElectionCenter() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections');
        setElections(data);
      } catch {
        setError('Failed to load elections.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Election center</p>
        <h1>Available Elections</h1>
        <p>Review election windows, candidates, and voting availability.</p>
      </header>

      {loading && <p className="empty-state">Loading elections...</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {elections.length === 0 && !loading ? (
          <p className="empty-state">No elections available right now.</p>
        ) : (
          elections.map((election) => (
            <Card key={election._id} title={election.title}>
              <p>{election.description || 'No description provided.'}</p>
              <div className="card-actions">
                <span className="badge badge-info">{election.status || 'Upcoming'}</span>
                <Link className="btn" to={`/election/${election._id}`}>View Details</Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
