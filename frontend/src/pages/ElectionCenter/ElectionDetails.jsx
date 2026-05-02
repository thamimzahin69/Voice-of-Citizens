import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { castVote, disableSuspiciousElection, fetchElectionDetails, fetchElectionTamperingStatus } from '../../api/apiClient';
import Card from '../../components/ui/Card';
import VotingTimer from '../../components/election/VotingTimer';
import VoterBadge from '../../components/election/VoterBadge';
import { useAuth } from '../../context/AuthContext';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString();
}

function statusClass(status) {
  if (status === 'active') return 'badge-active';
  if (status === 'finished' || status === 'closed') return 'badge-finished';
  if (status === 'disabled') return 'badge-rejected';
  return 'badge-upcoming';
}

function formatMetric(value) {
  if (value === undefined || value === null || value === '') return 'Not available';
  return value;
}

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'Not available';
  return `${Number(value).toFixed(1)}%`;
}

function buildStatisticsFallback(election) {
  const rankedCandidates = [...(election.leaderboard || election.candidates || [])].map((candidate, index) => {
    const voteCount = candidate.votes ?? candidate.finalVotes ?? 0;
    return {
      candidateId: candidate._id,
      candidateName: candidate.name,
      party: candidate.party || 'Independent',
      voteCount,
      rank: index + 1,
      sharePercent: 0,
    };
  });
  const totalVotes = rankedCandidates.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);

  return {
    totalVotes,
    eligibleVoterCount: null,
    turnoutPercent: null,
    candidates: rankedCandidates.map((candidate) => ({
      ...candidate,
      sharePercent: totalVotes ? Number(((candidate.voteCount / totalVotes) * 100).toFixed(2)) : 0,
    })),
    leadingCandidate: rankedCandidates[0] || null,
  };
}

export default function ElectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tamperingStatus, setTamperingStatus] = useState(null);
  const [tamperingLoading, setTamperingLoading] = useState(true);
  const [tamperingError, setTamperingError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableMessage, setDisableMessage] = useState('');
  const [voting, setVoting] = useState(false);
  const [nidInput, setNidInput] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [rankedSelections, setRankedSelections] = useState([]);
  const [voteMessage, setVoteMessage] = useState('');

  const loadElection = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchElectionDetails(id);
      setElection(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load election details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadElection();
  }, [loadElection]);

  const loadTamperingStatus = useCallback(async () => {
    try {
      setTamperingLoading(true);
      const res = await fetchElectionTamperingStatus(id);
      setTamperingStatus(res.data);
      setTamperingError('');
    } catch (err) {
      setTamperingError(err.response?.data?.message || 'Could not load tampering status');
    } finally {
      setTamperingLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTamperingStatus();
  }, [loadTamperingStatus]);

  async function handleDisableSuspiciousElection() {
    setDisableMessage('');
    setDisableLoading(true);
    try {
      const res = await disableSuspiciousElection(id);
      setDisableMessage(res.data?.message || 'Election disabled.');
      await Promise.all([loadElection(), loadTamperingStatus()]);
    } catch (err) {
      setDisableMessage(err.response?.data?.message || 'Could not disable election.');
    } finally {
      setDisableLoading(false);
    }
  }

  async function handleVote(e) {
    e.preventDefault();
    setVoteMessage('');
    setVoting(true);
    try {
      if (election.votingType === 'rankBased') {
        const ranked = (rankedSelections || []).filter(Boolean);
        if (ranked.length === 0) {
          setVoteMessage('Please provide at least one ranked preference.');
          setVoting(false);
          return;
        }
        const uniqueRanked = Array.from(new Set(ranked));
        if (uniqueRanked.length !== ranked.length) {
          setVoteMessage('Each candidate may only appear once in your ranking.');
          setVoting(false);
          return;
        }
        await castVote(id, { ranked: uniqueRanked, nid: nidInput });
      } else {
        if (!selectedCandidate) {
          setVoteMessage('Please select a candidate.');
          setVoting(false);
          return;
        }
        await castVote(id, { candidateId: selectedCandidate, nid: nidInput });
      }

      setVoteMessage('Vote cast successfully.');
      await loadElection();
      setNidInput('');
      setSelectedCandidate('');
      setRankedSelections([]);
    } catch (err) {
      setVoteMessage(err.response?.data?.message || 'Voting failed.');
    } finally {
      setVoting(false);
    }
  }

  if (loading) return <div className="text-center py-10">Loading election details...</div>;
  if (error || !election) return <div className="text-red-500 text-center py-10">{error || 'Election not found'}</div>;

  const { status, hasVoted, candidates = [], leaderboard = candidates, winner, title, description, startDate, endDate, rounds = 0 } = election;
  const isActive = status === 'active';
  const roundHeaders = Array.from({ length: rounds }, (_, idx) => `Round ${idx + 1}`);
  const isSuspicious = tamperingStatus?.isSuspicious || tamperingStatus?.suspicious;
  const suspiciousCandidates = tamperingStatus?.suspiciousCandidates || [];
  const statistics = election.statistics || buildStatisticsFallback(election);
  const rankedStats = statistics.candidates || [];
  const maxCandidateVotes = Math.max(...rankedStats.map((candidate) => candidate.voteCount || 0), 0);
  const leaderLabel = status === 'finished' ? 'Winner' : 'Leading candidate';

  return (
    <main className="page">
      <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '18px' }}>
        Back
      </button>

      <header className="page-header card">
        <p className="page-eyebrow">Election detail</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="card-actions">
          <span className={`badge ${statusClass(status)}`}>{status || 'Upcoming'}</span>
          {election.mode === 'testing' && <span className="badge badge-warning">Testing election</span>}
          {hasVoted && <span className="badge badge-voted">You have voted</span>}
          <span className="badge badge-info">{formatDate(startDate)} to {formatDate(endDate)}</span>
          {isAdmin && election.mode === 'testing' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/election/${id}/testing`)}
            >
              Manage Testing
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => navigate(`/election/${id}/candidates`)}
            style={{ marginLeft: 'auto' }}
          >
            View Candidates
          </button>
        </div>
      </header>

      <Card title="Tampering status" className={isSuspicious ? 'tampering-card tampering-card-alert' : 'tampering-card'}>
        {tamperingLoading && <p className="empty-state">Checking election integrity...</p>}
        {!tamperingLoading && tamperingError && <p className="form-error">{tamperingError}</p>}
        {!tamperingLoading && !tamperingError && !tamperingStatus && (
          <p className="empty-state">No tampering analysis is available for this election.</p>
        )}
        {!tamperingLoading && !tamperingError && tamperingStatus && (
          <div className="tampering-panel">
            <div className="tampering-summary">
              <span className={`badge ${isSuspicious ? 'badge-rejected' : 'badge-approved'}`}>
                {isSuspicious ? 'Potentially tampered' : 'Appears normal'}
              </span>
              <p>{tamperingStatus.explanation || tamperingStatus.message || 'Analysis completed.'}</p>
            </div>

            <div className="stat-grid tampering-metrics">
              <div className="stat-card">
                <span className="stat-label">Standard deviation</span>
                <strong className="stat-value">{formatMetric(tamperingStatus.standardDeviation)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Threshold</span>
                <strong className="stat-value">{formatMetric(tamperingStatus.threshold)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total votes</span>
                <strong className="stat-value">{formatMetric(tamperingStatus.totalVotes)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Suspicious candidates</span>
                <strong className="stat-value">{formatMetric(tamperingStatus.suspiciousCount ?? suspiciousCandidates.length)}</strong>
              </div>
            </div>

            {suspiciousCandidates.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Votes</th>
                      <th>Z-score</th>
                      <th>Deviation</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspiciousCandidates.map((candidate) => (
                      <tr key={`${candidate.candidate}-${candidate.alert}`}>
                        <td>{candidate.candidate}</td>
                        <td>{candidate.votes}</td>
                        <td>{candidate.zScore}</td>
                        <td>{candidate.deviations}</td>
                        <td>{candidate.alert}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">
                {tamperingStatus.message || 'No suspicious candidates were reported by the backend.'}
              </p>
            )}

            {tamperingStatus.benford && (
              <p className="tampering-note">
                Benford signal: {tamperingStatus.benford.signal}
                {tamperingStatus.benford.note ? ` (${tamperingStatus.benford.note})` : ''}
              </p>
            )}

            {isAdmin && isSuspicious && !tamperingStatus.electionDisabled && (
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDisableSuspiciousElection}
                  disabled={disableLoading}
                >
                  {disableLoading ? 'Disabling...' : 'Disable election'}
                </button>
              </div>
            )}

            {tamperingStatus.electionDisabled && <p className="form-error">This election is currently disabled.</p>}
            {disableMessage && (
              <p className={disableMessage.includes('disabled') ? 'form-success' : 'form-error'}>{disableMessage}</p>
            )}
          </div>
        )}
      </Card>

      <Card title="Election statistics" className="statistics-card">
        {rankedStats.length === 0 ? (
          <p className="empty-state">No candidate statistics are available yet.</p>
        ) : (
          <div className="statistics-panel">
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">Total votes cast</span>
                <strong className="stat-value">{statistics.totalVotes ?? 0}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">{leaderLabel}</span>
                <strong className="stat-value stat-value-text">
                  {statistics.leadingCandidate?.candidateName || 'Not available'}
                </strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Eligible voters</span>
                <strong className="stat-value">{formatMetric(statistics.eligibleVoterCount)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Voter turnout</span>
                <strong className="stat-value">{formatPercent(statistics.turnoutPercent)}</strong>
              </div>
            </div>

            <div className="vote-chart" aria-label="Vote distribution bar chart">
              {rankedStats.map((candidate) => {
                const width = maxCandidateVotes ? Math.max((candidate.voteCount / maxCandidateVotes) * 100, 2) : 2;
                return (
                  <div className="vote-bar-row" key={String(candidate.candidateId)}>
                    <div className="vote-bar-meta">
                      <span>{candidate.rank}. {candidate.candidateName}</span>
                      <strong>{candidate.voteCount} votes ({formatPercent(candidate.sharePercent)})</strong>
                    </div>
                    <div className="vote-bar-track">
                      <span className="vote-bar-fill" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Party</th>
                    <th>Votes</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedStats.map((candidate) => (
                    <tr key={`stats-${String(candidate.candidateId)}`}>
                      <td>#{candidate.rank}</td>
                      <td>{candidate.candidateName}</td>
                      <td>{candidate.party || 'Independent'}</td>
                      <td>{candidate.voteCount}</td>
                      <td>{formatPercent(candidate.sharePercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <div className="dashboard-grid">
        <Card title="Candidates">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Party</th>
                  {election.votingType === 'rankBased' ? (
                    roundHeaders.map((label) => <th key={label}>{label}</th>)
                  ) : (
                    <th>Votes</th>
                  )}
                  {election.votingType === 'rankBased' && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((candidate, idx) => (
                  <tr key={candidate._id}>
                    <td>#{idx + 1}</td>
                    <td>
                      <div className="candidate-table-cell">
                        {candidate.imageUrl && (
                          <img
                            src={candidate.imageUrl}
                            alt={`${candidate.name} profile`}
                            className="candidate-table-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span>{candidate.name}</span>
                      </div>
                    </td>
                    <td>{candidate.party || 'Independent'}</td>
                    {election.votingType === 'rankBased' ? (
                      roundHeaders.map((_, roundIndex) => {
                        const voteCount = candidate.roundVotes?.[roundIndex];
                        return (
                          <td key={roundIndex}>
                            {typeof voteCount === 'number' ? voteCount : 'x'}
                          </td>
                        );
                      })
                    ) : (
                      <td>{candidate.votes ?? 0}</td>
                    )}
                    {election.votingType === 'rankBased' && (
                      <td>
                        {candidate.eliminatedRound
                          ? `Eliminated R${candidate.eliminatedRound}`
                          : 'Winner'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {winner && <p className="form-success">Winner: {winner.name} ({winner.party || 'Independent'}) with {winner.votes} votes.</p>}
        </Card>

        {isActive && !hasVoted && (
          <Card title="Cast Vote">
            <VotingTimer />
            <form className="form-stack" onSubmit={handleVote}>
                    {election.votingType === 'rankBased' ? (
                      <div>
                        <span className="form-label">Rank candidates (1 = top choice)</span>
                        {Array.from({ length: candidates.length }).map((_, idx) => (
                          <label className="form-field" key={idx}>
                            <span className="form-label">Rank {idx + 1}</span>
                            <select
                              className="form-input"
                              value={rankedSelections[idx] || ''}
                              onChange={(e) => {
                                const next = [...(rankedSelections || [])];
                                next[idx] = e.target.value;
                                setRankedSelections(next);
                              }}
                            >
                              <option value="">-- Skip --</option>
                              {candidates.map((candidate) => {
                                const alreadySelected = rankedSelections.includes(candidate._id);
                                const isCurrent = rankedSelections[idx] === candidate._id;
                                return (
                                  <option
                                    key={candidate._id}
                                    value={candidate._id}
                                    disabled={alreadySelected && !isCurrent}
                                  >
                                    {candidate.name} ({candidate.party || 'Independent'})
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <label className="form-field">
                        <span className="form-label">Select candidate</span>
                        <select className="form-input" value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)} required>
                          <option value="">Choose a candidate</option>
                          {candidates.map((candidate) => (
                            <option key={candidate._id} value={candidate._id}>{candidate.name} ({candidate.party || 'Independent'})</option>
                          ))}
                        </select>
                      </label>
                    )}
              <label className="form-field">
                <span className="form-label">Your NID for verification</span>
                <input className="form-input" value={nidInput} onChange={(e) => setNidInput(e.target.value)} required placeholder="Enter your NID number" />
              </label>
              <button type="submit" disabled={voting} className="btn">{voting ? 'Submitting...' : 'Cast Vote'}</button>
              {voteMessage && <p className={voteMessage.includes('successfully') ? 'form-success' : 'form-error'}>{voteMessage}</p>}
            </form>
          </Card>
        )}

        {hasVoted && isActive && (
          <Card title="Voting status">
            <p className="form-success">You have already voted in this election.</p>
            <VoterBadge electionName={title} />
          </Card>
        )}

        {status === 'finished' && !hasVoted && (
          <Card title="Voting status">
            <p className="empty-state">This election has ended. Voting is no longer available.</p>
          </Card>
        )}
      </div>
    </main>
  );
}
