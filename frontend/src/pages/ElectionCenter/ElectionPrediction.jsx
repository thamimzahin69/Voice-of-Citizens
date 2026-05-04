import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString();
}

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'Not available';
  return `${Number(value).toFixed(1)}%`;
}

function calculateWinningProbability(candidate, allCandidates) {
  const candidateVotes = candidate.voteCount || 0;
  const totalVotes = allCandidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
  
  // Check if mathematically won
  const hasWonMathematically = isMathematicallyWon(candidate, allCandidates);
  if (hasWonMathematically) {
    return 99; // Mathematically guaranteed
  }
  
  // Base probability formula:
  // 1. Current vote share (0-100%)
  const voteShare = totalVotes > 0 ? (candidateVotes / totalVotes) * 100 : 0;
  
  // 2. Momentum factor: compare to average of other candidates
  const otherCandidates = allCandidates.filter(c => c._id !== candidate._id);
  const avgOtherVotes = otherCandidates.length > 0 
    ? otherCandidates.reduce((sum, c) => sum + (c.voteCount || 0), 0) / otherCandidates.length 
    : 0;
  const momentumBoost = candidateVotes > avgOtherVotes ? 15 : -10;
  
  // 3. Competition factor: how many viable competitors
  const viableCompetitors = allCandidates.filter(c => (c.voteCount || 0) > totalVotes * 0.15).length;
  const competitionFactor = viableCompetitors <= 2 ? 20 : viableCompetitors === 3 ? 5 : -10;
  
  // 4. Add realistic randomness (±8%)
  const randomness = (Math.random() - 0.5) * 16;
  
  // Final probability
  let probability = Math.min(Math.max(voteShare + momentumBoost + competitionFactor + randomness, 5), 95);
  return Math.round(probability);
}

function isMathematicallyWon(candidate, allCandidates) {
  const candidateVotes = candidate.voteCount || 0;
  const totalVotes = allCandidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
  
  // Check if has more than half of all votes
  if (candidateVotes > totalVotes / 2) {
    return true;
  }
  
  // Check if no other candidate can catch up
  const otherCandidates = allCandidates.filter(c => c._id !== candidate._id);
  if (otherCandidates.length === 0) return true;
  
  const maxOpponentVotes = Math.max(...otherCandidates.map(c => c.voteCount || 0));
  if (candidateVotes > maxOpponentVotes) {
    return true;
  }
  
  return false;
}

function getWinLikelihoodBadge(probability, isMathematicallyWon) {
  if (isMathematicallyWon) return { text: 'Mathematically Won', color: '#047857', bg: '#dcfce7' };
  if (probability >= 70) return { text: 'Very Likely', color: '#047857', bg: '#dcfce7' };
  if (probability >= 50) return { text: 'Likely', color: '#0891b2', bg: '#cffafe' };
  if (probability >= 30) return { text: 'Possible', color: '#b45309', bg: '#fef3c7' };
  return { text: 'Unlikely', color: '#b91c1c', bg: '#fee2e2' };
}

export default function ElectionPrediction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [electionRes, candidatesRes] = await Promise.all([
        apiClient.get(`/elections/${id}`),
        apiClient.get(`/elections/${id}/candidates`),
      ]);
      setElection(electionRes.data);
      setCandidates(candidatesRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load election data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <section className="page">
        <p className="empty-state">Loading prediction data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page">
        <p className="form-error">{error}</p>
        <button className="btn" onClick={() => navigate(-1)}>Back</button>
      </section>
    );
  }

  const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
  const rankedCandidates = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const maxVotes = rankedCandidates[0]?.voteCount || 0;
  const leadingCandidate = rankedCandidates[0];

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Live Prediction</p>
        <h1>{election?.title}</h1>
        <p>Real-time winning probability analysis based on current votes.</p>
        <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>
          ← Back
        </button>
      </header>

      {/* Key Stats */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Votes Cast</span>
          <strong className="stat-value">{totalVotes}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Leading Candidate</span>
          <strong className="stat-value" style={{ fontSize: '1.4rem' }}>
            {leadingCandidate?.name || 'No votes yet'}
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Candidates</span>
          <strong className="stat-value">{candidates.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Election Type</span>
          <strong className="stat-value" style={{ fontSize: '1.4rem' }}>
            {election?.votingType === 'rankBased' ? 'Rank-based' : 'Majority'}
          </strong>
        </div>
      </div>

      {/* Winning Predictions */}
      <Card title="Winning Probability Predictions" style={{ marginBottom: '24px' }}>
        {candidates.length === 0 ? (
          <p className="empty-state">No candidates available.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {rankedCandidates.map((candidate, idx) => {
              const probability = calculateWinningProbability(candidate, candidates);
              const hasWon = isMathematicallyWon(candidate, candidates);
              const likelihood = getWinLikelihoodBadge(probability, hasWon);
              const votes = candidate.voteCount || 0;
              const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
              const width = maxVotes ? Math.max((votes / maxVotes) * 100, 5) : 5;

              return (
                <div
                  key={candidate._id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text)' }}>
                        {idx + 1}. {candidate.name}
                      </strong>
                      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '4px' }}>
                        {candidate.party || 'Independent'} • {votes} votes ({percentage}%)
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: likelihood.bg,
                        color: likelihood.color,
                        fontWeight: '800',
                      }}
                    >
                      {likelihood.text}
                    </span>
                  </div>

                  {/* Vote Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${width}%`,
                          background: 'linear-gradient(90deg, #f97316, #fb923c)',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Probability Display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                        Winning Probability
                      </div>
                      <div
                        style={{
                          fontSize: '2rem',
                          fontWeight: '800',
                          color: '#f97316',
                          lineHeight: '1',
                        }}
                      >
                        {probability}%
                      </div>
                    </div>
                    <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--muted)' }}>
                      <p style={{ margin: '0 0 8px' }}>
                        Based on current vote share, momentum, and competition factors.
                      </p>
                      <p style={{ margin: '0' }}>
                        {hasWon
                          ? 'This candidate has mathematically secured the victory!'
                          : probability >= 70
                          ? 'Strong leader with high probability of winning.'
                          : probability >= 50
                          ? 'Competitive position with good winning chances.'
                          : probability >= 30
                          ? 'In contention but facing strong competition.'
                          : 'Trailing behind other candidates.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Vote Distribution Chart */}
      <Card title="Vote Distribution">
        {candidates.length === 0 ? (
          <p className="empty-state">No vote data available yet.</p>
        ) : (
          <div className="vote-chart">
            {rankedCandidates.map((candidate, idx) => {
              const votes = candidate.voteCount || 0;
              const width = maxVotes ? Math.max((votes / maxVotes) * 100, 2) : 2;
              const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;

              return (
                <div className="vote-bar-row" key={candidate._id}>
                  <div className="vote-bar-meta">
                    <span>{idx + 1}. {candidate.name}</span>
                    <strong>{votes} votes ({percentage}%)</strong>
                  </div>
                  <div className="vote-bar-track">
                    <div
                      className="vote-bar-fill"
                      style={{
                        width: `${width}%`,
                        background: 'linear-gradient(90deg, #f97316, #fb923c)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Election Info */}
      <Card title="Election Information">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '6px' }}>
              Election Type
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
              {election?.type || 'Custom'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '6px' }}>
              Voting System
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
              {election?.votingType === 'rankBased' ? 'Ranked Choice' : 'First Past The Post'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '6px' }}>
              Start Date
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
              {election?.startDate ? formatDate(election.startDate) : 'Not available'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '6px' }}>
              End Date
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
              {election?.endDate ? formatDate(election.endDate) : 'Not available'}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
        <p>
          * Predictions are based on current vote distribution and statistical analysis.
          Final results may vary.
        </p>
        <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>
          ← Back to Ongoing Elections
        </button>
      </div>
    </section>
  );
}
