import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function ResultsBoard() {
  const { election } = useOutletContext();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/elections/${election._id}/results`);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }

    if (election) load();
  }, [election]);

  return (
    <section className="subpage">
      <h2>Results</h2>
      {loading && <p>Loading results…</p>}
      {!loading && results.length === 0 && <p>No results are available yet.</p>}
      <div className="grid">
        {results.map((item) => (
          <Card key={item.candidateId} title={item.candidateName}>
            <p>
              <strong>Votes:</strong> {item.votes}
            </p>
            <p>
              <strong>Share:</strong> {item.sharePercent?.toFixed(1)}%
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
