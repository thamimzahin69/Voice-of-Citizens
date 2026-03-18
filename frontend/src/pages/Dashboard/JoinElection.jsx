import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function JoinElection() {
  const [elections, setElections] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections/active');
        setElections(data);
      } catch (err) {
        setError('Unable to load active elections.');
      }
    }

    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h1>Join an Election</h1>
        <p>Select an active election to view candidates and vote.</p>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {elections.length === 0 ? (
          <p>No active elections found.</p>
        ) : (
          elections.map((el) => (
            <Card key={el._id} title={el.title} className="election-card">
              <p>{el.description}</p>
              <p>
                <strong>Starts:</strong> {new Date(el.startDate).toLocaleString()}
              </p>
              <p>
                <strong>Ends:</strong> {new Date(el.endDate).toLocaleString()}
              </p>
              <a className="link" href={`/election/${el._id}`}>
                View election
              </a>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
