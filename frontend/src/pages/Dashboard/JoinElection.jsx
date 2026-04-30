import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchElections } from '../../api/apiClient';
import Card from '../../components/ui/Card';

function formatDate(dateString) {
  if (!dateString) return 'Date not set';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
}

function statusClass(status) {
  if (status === 'active') return 'badge-active';
  if (status === 'finished' || status === 'closed') return 'badge-finished';
  return 'badge-upcoming';
}

export default function JoinElection() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadElections() {
      try {
        const { data } = await fetchElections();
        setElections(data);
      } catch {
        setError('Unable to load elections. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadElections();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Election center</p>
        <h1>Join Election</h1>
        <p>Browse available elections, review timelines and candidates, then cast your vote when eligible.</p>
      </header>

      {loading && <p className="empty-state">Loading elections...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && elections.length === 0 ? (
        <p className="empty-state">No elections available right now.</p>
      ) : (
        <div className="grid">
          {elections.map((el) => (
            <Card key={el._id} title={el.title} className="election-card">
              <p>{el.description || 'No description provided.'}</p>
              <div className="card-actions">
                <span className={`badge ${statusClass(el.status)}`}>{el.status || 'Upcoming'}</span>
                {el.hasVoted && <span className="badge badge-voted">Voted</span>}
                <span className="badge badge-info">{el.candidateCount ?? el.candidates?.length ?? 0} candidates</span>
              </div>
              <p className="text-gray-600">
                {formatDate(el.startDate)} to {formatDate(el.endDate)}
              </p>
              <div className="card-actions">
                <Link to={`/election/${el._id}`} className="btn">View Details</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
