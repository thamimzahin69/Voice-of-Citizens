import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function ElectionHistory() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections/history');
        setHistory(data);
      } catch (err) {
        setError('Unable to load election history.');
      }
    }

    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h1>Election History</h1>
        <p>View past elections and results that you participated in.</p>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {history.length === 0 ? (
          <p>No election history available yet.</p>
        ) : (
          history.map((el) => (
            <Card key={el._id} title={el.title} className="election-card">
              <p>{el.description}</p>
              <p>
                <strong>Ended:</strong> {new Date(el.endDate).toLocaleString()}
              </p>
              <p>
                <strong>Result:</strong> {el.result ?? 'Pending'}
              </p>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
