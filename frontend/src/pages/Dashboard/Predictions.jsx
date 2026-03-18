import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections/predictions');
        setPredictions(data);
      } catch (err) {
        setError('Unable to load predictions.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h1>Predictions</h1>
        <p>View vote outcome projections based on current vote trends.</p>
      </header>

      {loading && <p>Loading predictions…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {predictions.length === 0 && !loading ? (
          <p>No prediction data available yet.</p>
        ) : (
          predictions.map((item) => (
            <Card key={item.electionId} title={item.electionTitle}>
              <p>
                <strong>Leading candidate:</strong> {item.leadingCandidate}
              </p>
              <p>
                <strong>Chance to win:</strong> {item.winProbability}%
              </p>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
