import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import VoteForm from '../../components/election/VoteForm';

export default function VotingInterface() {
  const { election } = useOutletContext();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get(`/elections/${election._id}/candidates`);
        setCandidates(data);
      } catch (err) {
        setMessage({ type: 'error', text: 'Unable to load candidates.' });
      }
    }

    if (election) load();
  }, [election]);

  async function handleVote(candidateId) {
    try {
      await apiClient.post(`/elections/${election._id}/vote`, { candidateId });
      setMessage({ type: 'success', text: 'Your vote has been submitted.' });
      setTimeout(() => navigate('/dashboard/overview'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message ?? 'Failed to submit vote.' });
    }
  }

  return (
    <section className="subpage">
      <h2>Voting</h2>
      <p>Select your preferred candidate and submit your vote.</p>
      {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'}>{message.text}</p>}
      <VoteForm candidates={candidates} onSubmit={handleVote} />
    </section>
  );
}
