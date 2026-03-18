import { Outlet, useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

export default function ElectionCenter() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadElection() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/elections/${electionId}`);
        setElection(data);
      } catch (err) {
        setError('Could not load election.');
      } finally {
        setLoading(false);
      }
    }

    loadElection();
  }, [electionId]);

  if (loading) return <p className="page">Loading election…</p>;
  if (error) return <p className="page form-error">{error}</p>;
  if (!election) return <p className="page">Election not found.</p>;

  return (
    <main className="page election-center">
      <header className="page-header">
        <h1>{election.title}</h1>
        <p>{election.description}</p>
        <p className="meta">
          <strong>Starts:</strong> {new Date(election.startDate).toLocaleString()} •{' '}
          <strong>Ends:</strong> {new Date(election.endDate).toLocaleString()}
        </p>
        <div className="election-actions">
          <Link to="candidates" className="btn">
            Candidate list
          </Link>
          <Link to="manifesto" className="btn btn-secondary">
            Manifestos
          </Link>
          <Link to="vote" className="btn btn-secondary">
            Vote now
          </Link>
          <Link to="results" className="btn btn-secondary">
            Results
          </Link>
        </div>
      </header>

      <Outlet context={{ election }} />

      <button type="button" className="link-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </main>
  );
}
