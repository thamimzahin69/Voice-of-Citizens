import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleDateString();
}

export default function ElectionHistory() {
  const { isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections/history');
        setHistory(data);
      } catch {
        setError('Unable to load election history.');
      }
    }

    load();
  }, []);

  const filtered = useMemo(
    () => history.filter((el) => (el.title || '').toLowerCase().includes(query.toLowerCase())),
    [history, query],
  );

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Election archive' : 'My participation'}</p>
        <h1>History</h1>
        <p>{isAdmin ? 'Review broader election history summaries.' : 'View your election participation history.'}</p>
      </header>

      <Card>
        <label className="form-field">
          <span className="form-label">Search elections</span>
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by election name"
          />
        </label>
      </Card>

      {error && <p className="form-error">{error}</p>}

      {filtered.length === 0 ? (
        <p className="empty-state">No election history available yet.</p>
      ) : (
        <div className="card" style={{ marginTop: '18px' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Election name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>{isAdmin ? 'Result' : 'Vote cast'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((el) => (
                  <tr key={el._id}>
                    <td>{el.title}</td>
                    <td>{formatDate(el.endDate || el.startDate)}</td>
                    <td><span className="badge badge-finished">{el.status || 'Completed'}</span></td>
                    <td>{isAdmin ? (el.result || el.winner || 'Pending') : (el.hasVoted ? 'Voted' : 'Not voted')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
