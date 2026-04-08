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
        <h1>All Elections</h1>
        <p>Browse all elections, view details, and vote (NID verification required).</p>
      </header>
      <div className="grid">
        {elections.length === 0 ? (
          <p>No elections available at this time.</p>
        ) : (
          elections.map((el) => (
            <Card key={el._id} title={el.title} className="election-card">
              <p className="text-gray-600 mb-2">{el.description}</p>
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 text-xs rounded-full mr-2 ${
                  el.status === 'active' ? 'bg-green-100 text-green-800' :
                  el.status === 'finished' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {el.status.toUpperCase()}
                </span>
                {el.hasVoted && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    ✓ Voted
                  </span>
                )}
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 ml-2">
                  {el.candidateCount} candidate{el.candidateCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                📅 {formatDate(el.startDate)} – {formatDate(el.endDate)}
              </p>
              <div className="card-actions mt-3">
                <Link to={`/election/${el._id}`} className="btn btn-primary">
                  View Details
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}