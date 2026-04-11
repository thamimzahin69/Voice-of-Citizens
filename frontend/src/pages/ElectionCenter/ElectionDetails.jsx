// src/pages/ElectionCenter/ElectionDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchElectionDetails, castVote } from '../../api/apiClient';
import Card from '../../components/ui/Card';
import VotingTimer from '../../components/election/VotingTimer';
import VoterBadge from '../../components/election/VoterBadge';

const ElectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [nidInput, setNidInput] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [voteMessage, setVoteMessage] = useState('');

  useEffect(() => {
    loadElection();
  }, [id]);

  const loadElection = async () => {
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
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      setVoteMessage('Please select a candidate');
      return;
    }
    setVoting(true);
    setVoteMessage('');
    try {
      await castVote(id, selectedCandidate, nidInput);
      setVoteMessage('Vote cast successfully!');
      // Refresh election data to update leaderboard and hasVoted status
      await loadElection();
      setNidInput('');
      setSelectedCandidate('');
    } catch (err) {
      setVoteMessage(err.response?.data?.message || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading election details...</div>;
  if (error || !election) return <div className="text-red-500 text-center py-10">{error || 'Election not found'}</div>;

  const { status, hasVoted, candidates, leaderboard, winner, title, description, startDate, endDate } = election;
  const isActive = status === 'active';
  const canVote = isActive && !hasVoted;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary-blue)',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'translateX(-4px)')}
        onMouseLeave={(e) => (e.target.style.transform = 'translateX(0)')}
      >
        ← Back
      </button>

      {/* Election Info Card */}
      <Card className="mb-8" style={{ marginBottom: '24px' }}>
        <h1 style={{
          marginTop: 0,
          marginBottom: '12px',
          fontSize: '32px',
          fontWeight: '800',
          background: 'var(--primary-gradient)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {title}
        </h1>
        <p style={{
          color: 'var(--gray-text)',
          marginBottom: '20px',
          fontSize: '16px',
          lineHeight: '1.6',
        }}>
          {description}
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          fontSize: '14px',
        }}>
          <div className="election-meta">
            <span className="election-meta-icon">🗓️</span>
            <span>{new Date(startDate).toLocaleString()} – {new Date(endDate).toLocaleString()}</span>
          </div>
          <span className={`badge ${
            status === 'active' ? 'badge-active' :
            status === 'finished' ? 'badge-finished' : 'badge-upcoming'
          }`}>
            {status === 'active' ? '🔴 Active' :
             status === 'finished' ? '✓ Finished' : '⏰ Upcoming'}
          </span>
          {hasVoted && <span className="badge badge-voted">✓ You Voted</span>}
        </div>
      </Card>

      {/* Leaderboard / Candidates Table */}
      <Card style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '20px',
          color: 'var(--gray-darker)',
        }}>
          🏅 Candidates & Leaderboard
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--gray-text)', textTransform: 'uppercase', fontSize: '12px' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--gray-text)', textTransform: 'uppercase', fontSize: '12px' }}>Candidate</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--gray-text)', textTransform: 'uppercase', fontSize: '12px' }}>Party</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: 'var(--gray-text)', textTransform: 'uppercase', fontSize: '12px' }}>Votes</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((candidate, idx) => (
                <tr 
                  key={candidate._id} 
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: winner && winner._id === candidate._id ? 'rgba(122, 201, 133, 0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = winner && winner._id === candidate._id ? 'rgba(122, 201, 133, 0.1)' : 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--gray-darker)' }}>#{idx + 1}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gray-darker)', fontWeight: '500' }}>{candidate.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--gray-text)' }}>{candidate.party || 'Independent'}</td>
                  <td style={{ padding: '12px 16px', color: '#667eea', fontWeight: '600' }}>{candidate.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {winner && (
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(122, 201, 133, 0.1) 0%, rgba(168, 213, 186, 0.1) 100%)',
            borderRadius: '12px',
            borderLeft: '4px solid #7ac985',
            fontSize: '16px',
            fontWeight: '600',
            color: '#155724',
          }}>
            🏆 Winner: <strong>{winner.name}</strong> ({winner.party || 'Independent'}) with <strong>{winner.votes}</strong> votes
          </div>
        )}
      </Card>

      {/* Voting Section */}
      {isActive && !hasVoted && (
        <Card style={{ marginBottom: '24px' }}>
          <VotingTimer />
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '20px',
            color: 'var(--gray-darker)',
          }}>
            🗳️ Cast Your Vote
          </h2>
          <form onSubmit={handleVote} style={{ maxWidth: '500px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--gray-darker)',
                fontSize: '14px',
              }}>
                Select Candidate
              </label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-blue)')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                required
              >
                <option value="">-- Choose a candidate --</option>
                {candidates.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.party || 'Independent'})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'var(--gray-darker)',
                fontSize: '14px',
              }}>
                Your NID (for verification)
              </label>
              <input
                type="text"
                value={nidInput}
                onChange={(e) => setNidInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-blue)')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                required
                placeholder="Enter your NID number"
              />
            </div>
            <button
              type="submit"
              disabled={voting}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginBottom: '16px',
              }}
            >
              {voting ? '⏳ Submitting...' : '✓ Confirm Vote'}
            </button>
            {voteMessage && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: voteMessage.includes('successfully') ? 'var(--success-soft)' : 'var(--error-soft)',
                color: voteMessage.includes('successfully') ? 'var(--success-text)' : 'var(--error-text)',
                marginBottom: '8px',
              }}>
                {voteMessage}
              </div>
            )}
          </form>
        </Card>
      )}

      {hasVoted && status === 'active' && (
        <>
          <Card style={{
            background: 'linear-gradient(135deg, rgba(122, 201, 133, 0.1) 0%, rgba(168, 213, 186, 0.1) 100%)',
            borderLeft: '4px solid #7ac985',
          }}>
            <p style={{
              margin: 0,
              textAlign: 'center',
              fontWeight: '600',
              color: '#155724',
              fontSize: '16px',
            }}>
              ✓ You have already voted in this election. Thank you for participating!
            </p>
          </Card>
          <VoterBadge electionName={title} />
        </>
      )}

      {status === 'finished' && !hasVoted && (
        <Card className="bg-gray-50 border-gray-200">
          <p className="text-gray-700">This election has ended. Voting is no longer available.</p>
        </Card>
      )}
    </div>
  );
};

export default ElectionDetails;