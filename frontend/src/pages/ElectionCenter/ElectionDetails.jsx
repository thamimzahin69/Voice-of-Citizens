import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchElectionDetails, castVote } from '../../api/apiClient';
import Card from '../../components/ui/Card';
import VotingTimer from '../../components/election/VotingTimer';
import VoterBadge from '../../components/election/VoterBadge';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString();
}

function statusClass(status) {
  if (status === 'active') return 'badge-active';
  if (status === 'finished' || status === 'closed') return 'badge-finished';
  return 'badge-upcoming';
}

export default function ElectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const irvRounds = election.roundResults || [];
  const roundHeaders = Array.from({ length: rounds }, (_, idx) => `Round ${idx + 1}`);

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
          {hasVoted && <span className="badge badge-voted">You have voted</span>}
          <span className="badge badge-info">{formatDate(startDate)} to {formatDate(endDate)}</span>
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
