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

function getLeadingCandidate(candidates) {
  if (!candidates || candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  return sorted[0];
}

function getDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RecurrentElections() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
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
        const { data } = await apiClient.get('/elections');
        
        // Filter only ongoing elections (endDate >= now)
        let ongoingElections = data.filter(el => new Date(el.endDate) >= now);
        
        // Fetch candidates for each election to get vote counts
        ongoingElections = await Promise.all(
          ongoingElections.map(async (el) => {
            try {
              const { data: candidatesData } = await apiClient.get(`/elections/${el._id}/candidates`);
              return {
                ...el,
                candidates: candidatesData,
              };
            } catch {
              return el;
            }
          })
        );
        
        // Sort by createdAt descending (newest first)
        setOngoing(ongoingElections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch {
        setError('Unable to load ongoing elections.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(
    () => ongoing.filter((el) => {
      const titleMatch = (el.title || '').toLowerCase().includes(query.toLowerCase());
      const typeMatch = typeFilter === '' || (el.type || '').toLowerCase() === typeFilter.toLowerCase();
      return titleMatch && typeMatch;
    }),
    [ongoing, query, typeFilter],
  );

  const stats = useMemo(
    () => ({
      activeElections: ongoing.length,
      totalCurrentVotes: ongoing.reduce((sum, el) => {
        const votesFromCandidates = (el.candidates || []).reduce((total, cand) => total + (cand.voteCount || 0), 0);
        return sum + votesFromCandidates;
      }, 0),
      avgDaysRemaining: ongoing.length > 0
        ? Math.ceil(ongoing.reduce((sum, el) => sum + getDaysRemaining(el.endDate), 0) / ongoing.length)
        : 0,
    }),
    [ongoing],
  );

  const uniqueTypes = useMemo(
    () => [...new Set(ongoing.map((el) => el.type).filter(Boolean))],
    [ongoing],
  );

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Active elections' : 'My voting'}</p>
        <h1>Ongoing Elections</h1>
        <p>
          {isAdmin
            ? 'Monitor active elections and current voting trends in real-time.'
            : 'Participate in ongoing elections and see live results.'}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-icon">Ballot</span>
          <strong className="stat-value">{stats.activeElections}</strong>
          <span className="stat-label">Active Elections</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">Votes</span>
          <strong className="stat-value">{stats.totalCurrentVotes.toLocaleString()}</strong>
          <span className="stat-label">Current Votes</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">Clock</span>
          <strong className="stat-value">{stats.avgDaysRemaining}</strong>
          <span className="stat-label">Avg. Days Left</span>
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

      {loading && <p className="empty-state">Loading ongoing elections...</p>}

      {!loading && filtered.length === 0 ? (
        <p className="empty-state">
          {ongoing.length === 0
            ? 'No ongoing elections at the moment.'
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
                  <th>Ends</th>
                  <th>Current Votes</th>
                  <th>{isAdmin ? 'Leading' : 'Vote Status'}</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((el) => {
                  const leading = getLeadingCandidate(el.candidates || []);
                  const daysLeft = getDaysRemaining(el.endDate);
                  const totalVotes = (el.candidates || []).reduce((sum, cand) => sum + (cand.voteCount || 0), 0);
                  return (
                    <tr key={el._id}>
                      <td>
                        <strong>{el.title}</strong>
                      </td>
                      <td>
                        <span className="badge badge-active">{el.type || 'General'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-upcoming">{daysLeft}d</span>
                          <span>{formatDate(el.endDate)}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{totalVotes}</strong>
                      </td>
                      <td>
                        {isAdmin ? (
                          leading ? (
                            <div>
                              <strong style={{ color: 'var(--accent)' }}>{leading.name}</strong>
                              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                {leading.voteCount || 0} votes
                              </div>
                            </div>
                          ) : (
                            <span className="badge badge-pending">No votes yet</span>
                          )
                        ) : (
                          <span className={`badge ${el.hasVoted ? 'badge-voted' : 'badge-upcoming'}`}>
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
                            border: 'none',
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
    </section>
  );
}
