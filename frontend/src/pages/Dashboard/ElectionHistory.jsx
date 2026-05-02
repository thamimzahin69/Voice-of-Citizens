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

function getLeadingCandidate(candidates) {
  if (!candidates || candidates.length === 0) return null;
  return candidates.reduce((leader, cand) => 
    (cand.voteCount || 0) > (leader.voteCount || 0) ? cand : leader
  );
}

export default function ElectionHistory() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const { data: allElections } = await apiClient.get('/elections');
        
        // Separate into history and ongoing
        const historyElections = allElections.filter(el => new Date(el.endDate) < now);
        const ongoingElections = allElections.filter(el => new Date(el.endDate) >= now);
        
        setHistory(historyElections.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)));
        setOngoing(ongoingElections.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)));
      } catch {
        setError('Unable to load elections.');
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

  const filteredOngoing = useMemo(
    () => ongoing.filter((el) => {
      const titleMatch = (el.title || '').toLowerCase().includes(query.toLowerCase());
      const typeMatch = typeFilter === '' || (el.type || '').toLowerCase() === typeFilter.toLowerCase();
      return titleMatch && typeMatch;
    }),
    [ongoing, query, typeFilter],
  );

  const stats = useMemo(
    () => {
      const allElections = [...history, ...ongoing];
      return {
        totalElections: allElections.length,
        ongoingCount: ongoing.length,
        totalVotes: history.reduce((sum, el) => sum + (el.totalVotesCast || 0), 0),
        avgTurnout: history.length > 0
          ? (history.reduce((sum, el) => sum + parseFloat(el.turnoutPercent || 0), 0) / history.length).toFixed(1)
          : 0,
      };
    },
    [history, ongoing],
  );

  const uniqueTypes = useMemo(
    () => [...new Set([...history, ...ongoing].map((el) => el.type).filter(Boolean))],
    [history, ongoing],
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
          <span className="stat-icon">Ballot</span>
          <strong className="stat-value">{stats.ongoingCount}</strong>
          <span className="stat-label">Ongoing Elections</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">Votes</span>
          <strong className="stat-value">{stats.totalVotes.toLocaleString()}</strong>
          <span className="stat-label">Votes Cast (History)</span>
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

      {/* ONGOING ELECTIONS SECTION */}
      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px solid var(--border)' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.8rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Ongoing Elections
        </h2>

        {!loading && filteredOngoing.length === 0 ? (
          <p className="empty-state">
            {ongoing.length === 0
              ? 'No ongoing elections at the moment.'
              : 'No ongoing elections match your search. Try adjusting the filters.'}
          </p>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Election</th>
                    <th>Type</th>
                    <th>Ends</th>
                    <th>Current Votes</th>
                    <th>{isAdmin ? 'Leading' : 'Status'}</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOngoing.map((el) => {
                    const leadingCandidate = getLeadingCandidate(el.candidates || []);
                    return (
                      <tr key={el._id}>
                        <td>
                          <strong>{el.title}</strong>
                        </td>
                        <td>
                          <span className="badge badge-info">{el.type || 'General'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{formatDate(el.endDate)}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{el.totalVotesCast || 0}</strong> votes
                        </td>
                        <td>
                          {isAdmin ? (
                            leadingCandidate ? (
                              <div>
                                <strong style={{ color: 'var(--accent)' }}>{leadingCandidate.name}</strong>
                                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                  {leadingCandidate.voteCount || 0} votes
                                </div>
                              </div>
                            ) : (
                              <span className="badge badge-pending">No votes yet</span>
                            )
                          ) : (
                            <span className={`badge ${el.hasVoted ? 'badge-voted' : 'badge-pending'}`}>
                              {el.hasVoted ? 'Voted' : 'Not voted'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn"
                            onClick={() => navigate(`/election/${el._id}/prediction`)}
                            style={{
                              padding: '8px 14px',
                              fontSize: '0.85rem',
                              minHeight: 'auto',
                              background: 'linear-gradient(135deg, #f97316, #fb923c)',
                              boxShadow: '0 8px 16px rgba(249, 115, 22, 0.2)',
                            }}
                          >
                            Prediction
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
