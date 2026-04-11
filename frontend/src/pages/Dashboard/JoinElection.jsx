import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchElections } from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function JoinElection() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadElections() {
      try {
        const { data } = await fetchElections();
        setElections(data);
      } catch (err) {
        setError('Unable to load elections. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadElections();
  }, []);

  if (loading) return <div className="text-center py-10">Loading elections...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  // Helper to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>✨ All Elections</h1>
        <p>Browse all elections, view details, and vote (NID verification required).</p>
      </header>
      <div className="grid">
        {elections.length === 0 ? (
          <p>No elections available at this time.</p>
        ) : (
          elections.map((el) => (
            <Card key={el._id} title={el.title} className="election-card">
              <p className="text-gray-600 mb-3">{el.description}</p>
              <div className="mb-3">
                <span className={`badge ${
                  el.status === 'active' ? 'badge-active' :
                  el.status === 'finished' ? 'badge-finished' : 'badge-upcoming'
                }`}>
                  {el.status === 'active' ? '🔴 Active' :
                   el.status === 'finished' ? '✓ Finished' : '⏰ Upcoming'}
                </span>
                {el.hasVoted && (
                  <span className="badge badge-voted">✓ Voted</span>
                )}
                <span className="badge badge-upcoming" style={{background: 'linear-gradient(135deg, #e8d5f2 0%, #d8bff0 100%)', color: '#5a3f7d'}}>
                  👥 {el.candidateCount} candidate{el.candidateCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="election-meta">
                <span className="election-meta-icon">🗓️</span>
                <span>{formatDate(el.startDate)} – {formatDate(el.endDate)}</span>
              </div>
              <div className="card-actions mt-3">
                <Link to={`/election/${el._id}`} className="btn btn-primary">
                  View Details →
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}