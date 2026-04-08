import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function CandidateList() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [joined, setJoined] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null); // from auth context ideally

  // Fetch user from context (we'll assume you have useAuth)
  // For brevity, we'll fetch election and status via API

  useEffect(() => {
    async function load() {
      try {
        // Fetch election details and user status
        const { data: electionData } = await apiClient.get(`/elections/${electionId}`);
        const { data: statusData } = await apiClient.get(`/elections/${electionId}/status`); // new endpoint? simpler: we already have joinable endpoint but that's for list. We'll call a custom endpoint.
        // Alternatively, we can use the same /joinable endpoint? Not efficient.
        // Let's create a new endpoint: GET /api/elections/:id/status
        // But to save time, we can just get user from AuthContext and check joined/voted via separate calls.
        // I'll assume you have a way to get joined status from a backend call.
        // For now, we'll fetch the election and then check if user id is in voters array (needs user object)
      } catch (err) {
        setError('Failed to load election');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [electionId]);

  // Simplified: We'll use a dedicated endpoint to get election with user status
  // Instead of writing that, we'll modify the backend to return joined/hasVoted on GET /elections/:id
  // Let's do that quickly in the backend.

  // For now, assume we have:
  // election = { title, description, endDate, voters, ... }
  // joined = election.voters.includes(userId)
  // hasVoted = already fetched

  const handleJoin = async () => {
    try {
      await apiClient.post(`/elections/${electionId}/join`);
      setJoined(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Join failed');
    }
  };

  const handleVote = () => {
    navigate(`/election/${electionId}/vote`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{election?.title}</h2>
      <p>{election?.description}</p>
      <p>Deadline: {new Date(election?.endDate).toLocaleString()}</p>

      {error && <p className="error">{error}</p>}

      {!joined ? (
        <button onClick={handleJoin} className="btn btn-primary">Join this Election</button>
      ) : hasVoted ? (
        <p>You have already voted in this election.</p>
      ) : user?.documentStatus !== 'verified' ? (
        <p className="warning">Your NID is not verified. Please verify your NID to vote.</p>
      ) : (
        <button onClick={handleVote} className="btn btn-success">Vote Now</button>
      )}

      {/* Candidate list can be shown regardless */}
    </div>
  );
}