import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import VotingTimer from '../../components/election/VotingTimer';

export default function VotingInterface() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [status, setStatus] = useState({ joined: false, hasVoted: false });
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch election status (joined, hasVoted)
        const statusRes = await apiClient.get(`/elections/${electionId}/status`);
        setStatus(statusRes.data);

        // Fetch candidates only if user has joined (optional, but nice)
        const candidatesRes = await apiClient.get(`/elections/${electionId}/candidates`);
        setCandidates(candidatesRes.data);
      } catch (err) {
        setError('Failed to load voting data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [electionId]);

  const handleVote = async (candidateId) => {
    setVoting(true);
    setError('');
    try {
      await apiClient.post(`/elections/${electionId}/vote`, { candidateId });
      alert('Vote cast successfully!');
      // Redirect to results page
      navigate(`/election/${electionId}/results`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Voting failed';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div>Loading voting interface...</div>;

  const { joined, hasVoted } = status;
  const isNidVerified = user?.documentStatus === 'verified';

  // Render blocking messages
  if (hasVoted) {
    return (
      <div className="voting-interface">
        <h2>Voting</h2>
        <p className="info">You have already voted in this election.</p>
        <button onClick={() => navigate(`/election/${electionId}/results`)}>
          View Results
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="voting-interface">
        <h2>Voting</h2>
        <p className="warning">
          You must join this election before voting. 
          <button onClick={() => navigate(`/election/${electionId}/candidates`)}>
            Go to Election Page to Join
          </button>
        </p>
      </div>
    );
  }

  if (!isNidVerified) {
    return (
      <div className="voting-interface">
        <h2>Voting</h2>
        <p className="warning">
          Your NID is not verified. Please complete NID verification to vote.
        </p>
      </div>
    );
  }

  return (
    <div className="voting-interface">
      <VotingTimer />
      <h2>Cast Your Vote</h2>
      {error && <p className="error">{error}</p>}
      <ul className="candidates-list">
        {candidates.map(candidate => (
          <li key={candidate._id} className="candidate-item">
            <strong>{candidate.name}</strong> ({candidate.party})
            <p>{candidate.manifesto}</p>
            <button 
              onClick={() => handleVote(candidate._id)} 
              disabled={voting}
              className="btn btn-primary"
            >
              {voting ? 'Submitting...' : 'Vote'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}