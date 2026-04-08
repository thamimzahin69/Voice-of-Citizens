import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext'; // adjust path

export default function CandidateList() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // get logged-in user data (includes documentStatus)
  
  const [election, setElection] = useState(null);
  const [status, setStatus] = useState({ joined: false, hasVoted: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch election details
        const electionRes = await apiClient.get(`/elections/${electionId}`);
        setElection(electionRes.data);
        
        // Fetch user's status (joined, voted)
        const statusRes = await apiClient.get(`/elections/${electionId}/status`);
        setStatus(statusRes.data);
      } catch (err) {
        setError('Failed to load election data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [electionId]);

const handleJoin = async () => {
  setJoinLoading(true);
  setError(''); // clear old error
  try {
    const response = await apiClient.post(`/elections/${electionId}/join`);
    console.log('Join success:', response.data);
    setStatus(prev => ({ ...prev, joined: true }));
    // Show a success message (optional)
    alert('You have successfully joined this election!');
  } catch (err) {
    console.error('Join error:', err);
    // Extract error message from response
    const msg = err.response?.data?.msg || err.message || 'Failed to join election';
    setError(msg);
  } finally {
    setJoinLoading(false);
  }
};

  const handleVote = () => {
    navigate(`/election/${electionId}/vote`);
  };

  if (loading) return <div>Loading election details...</div>;
  if (error && !election) return <div className="error">{error}</div>;

  const { joined, hasVoted } = status;
  const isNidVerified = user?.documentStatus === 'verified';

  return (
    <div className="candidate-list-container">
      <h2>{election?.title}</h2>
      <p>{election?.description}</p>
      <p><strong>Ends:</strong> {election?.endDate ? new Date(election.endDate).toLocaleString() : 'Not set'}</p>

      {error && <p className="form-error">{error}</p>}

      <div className="election-action">
        {hasVoted ? (
          <p className="info">You have already voted in this election.</p>
        ) : joined ? (
          !isNidVerified ? (
            <p className="warning">Your NID is not verified. Please verify your NID to vote.</p>
          ) : (
            <button className="btn btn-primary" onClick={handleVote}>
              Vote Now
            </button>
          )
        ) : (
          <button className="btn btn-secondary" onClick={handleJoin} disabled={joinLoading}>
            {joinLoading ? 'Joining...' : 'Join this Election'}
          </button>
        )}
      </div>

      {/* Candidate list display (you likely already have this) */}
      {/* You can fetch candidates via /elections/:electionId/candidates and render them here */}
    </div>
  );
}