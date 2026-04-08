// src/pages/ElectionCenter/ElectionDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchElectionDetails, castVote } from '../../api/apiClient';
import Card from '../../components/ui/Card';

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Election Info Card */}
      <Card className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>📅 {new Date(startDate).toLocaleString()} – {new Date(endDate).toLocaleString()}</span>
          <span className={`font-semibold ${
            status === 'active' ? 'text-green-600' : status === 'finished' ? 'text-gray-600' : 'text-yellow-600'
          }`}>
            Status: {status.toUpperCase()}
          </span>
          {hasVoted && <span className="text-blue-600">✓ You have already voted in this election</span>}
        </div>
      </Card>

      {/* Leaderboard / Candidates Table */}
      <Card className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Candidates & Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((candidate, idx) => (
                <tr key={candidate._id} className={winner && winner._id === candidate._id ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{candidate.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.party || 'Independent'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {winner && (
          <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-green-800 font-bold">🏆 Winner: {winner.name} ({winner.party || 'Independent'}) with {winner.votes} votes</p>
          </div>
        )}
      </Card>

      {/* Voting Section */}
      {isActive && !hasVoted && (
        <Card>
          <h2 className="text-2xl font-bold mb-4">Cast Your Vote</h2>
          <form onSubmit={handleVote} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Candidate</label>
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">-- Choose a candidate --</option>
                {candidates.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.party || 'Independent'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your NID (for verification)</label>
              <input
                type="text"
                value={nidInput}
                onChange={(e) => setNidInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Enter your NID number"
              />
            </div>
            <button
              type="submit"
              disabled={voting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {voting ? 'Submitting...' : 'Confirm Vote'}
            </button>
            {voteMessage && (
              <p className={`text-sm ${voteMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {voteMessage}
              </p>
            )}
          </form>
        </Card>
      )}

      {hasVoted && status === 'active' && (
        <Card className="bg-blue-50 border-blue-200">
          <p className="text-blue-800">You have already voted in this election. Thank you for participating!</p>
        </Card>
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