import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import CandidateCard from '../../components/election/CandidateCard';

export default function CandidateList() {
  const { election } = useOutletContext();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/elections/${election._id}/candidates`);
        setCandidates(data);
      } finally {
        setLoading(false);
      }
    }

    if (election) load();
  }, [election]);

  return (
    <section className="subpage">
      <h2>Candidate List</h2>
      {loading && <p>Loading candidates…</p>}
      {!loading && candidates.length === 0 && <p>No candidates have been added yet.</p>}
      <div className="grid">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate._id} candidate={candidate} />
        ))}
      </div>
    </section>
  );
}
