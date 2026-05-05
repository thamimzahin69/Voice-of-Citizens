import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleDateString();
}

function getElectionYear(date) {
  return new Date(date).getFullYear();
}

export default function ElectionHistory() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/elections/history');
        setHistory(data);
      } catch {
        setError('Unable to load election history.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(
    () => history.filter((el) => {
      const titleMatch = (el.title || '').toLowerCase().includes(query.toLowerCase());
      const typeMatch = typeFilter === '' || (el.type || '').toLowerCase() === typeFilter.toLowerCase();
      return titleMatch && typeMatch;
    }),
    [history, query, typeFilter],
  );

  const stats = useMemo(
    () => ({
      totalElections: history.length,
      totalVotes: history.reduce((sum, el) => sum + (el.totalVotesCast || 0), 0),
      avgTurnout: history.length > 0
        ? (history.reduce((sum, el) => sum + parseFloat(el.turnoutPercent || 0), 0) / history.length).toFixed(1)
        : 0,
    }),
    [history],
  );

  const uniqueTypes = useMemo(
    () => [...new Set(history.map((el) => el.type).filter(Boolean))],
    [history],
  );

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Election archive' : 'My participation'}</p>
        <h1>Election History</h1>
        <p>
          {isAdmin
            ? 'Review past elections, winners, and participation statistics.'
            : 'View your election participation history and results.'}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-icon">Archive</span>
          <strong className="stat-value">{stats.totalElections}</strong>
          <span className="stat-label">Total Elections</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">Votes</span>
          <strong className="stat-value">{stats.totalVotes.toLocaleString()}</strong>
          <span className="stat-label">Votes Cast</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">Turnout</span>
          <strong className="stat-value">{stats.avgTurnout}%</strong>
          <span className="stat-label">Avg. Turnout</span>
        </div>
      </div>

      {/* Filters Card */}
      <Card style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label className="form-field">
            <span className="form-label">Search elections</span>
            <input
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type election name..."
            />
          </label>
          <label className="form-field">
            <span className="form-label">Filter by type</span>
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Results */}
      {error && <p className="form-error">{error}</p>}

      {loading && <p className="empty-state">Loading election history...</p>}

      {!loading && filtered.length === 0 ? (
        <p className="empty-state">
          {history.length === 0
            ? 'No election history available yet.'
            : 'No elections match your search. Try adjusting the filters.'}
        </p>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Election</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Turnout</th>
                  <th>{isAdmin ? 'Winner' : 'Vote Status'}</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((el) => (
                  <tr key={el._id}>
                    <td>
                      <strong>{el.title}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info">{el.type || 'General'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-finished">{getElectionYear(el.endDate)}</span>
                        <span>{formatDate(el.endDate || el.startDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="vote-bar-track" style={{ width: '60px', height: '6px' }}>
                          <div
                            className="vote-bar-fill"
                            style={{ width: `${Math.min(el.turnoutPercent || 0, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                          {el.turnoutPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {isAdmin ? (
                        el.winner ? (
                          <div>
                            <strong style={{ color: 'var(--success)' }}>{el.winner.name}</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                              {el.winner.votes} votes
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-finished">No winner</span>
                        )
                      ) : (
                        <span className={`badge ${el.hasVoted ? 'badge-voted' : 'badge-finished'}`}>
                          {el.hasVoted ? 'Voted' : 'Not voted'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn"
                        onClick={() => navigate(`/election/${el._id}`)}
                        style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: 'auto' }}
                      >
                        View Details
                      </button>
                    </td>
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
