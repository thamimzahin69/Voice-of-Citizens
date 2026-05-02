import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTestingElectionAssignments,
  generateTestingElectionVotes,
} from '../../api/apiClient';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString();
}

export default function TestingElectionManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [election, setElection] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await fetchTestingElectionAssignments(id);
      setElection(data.election);
      setVoters(data.voters || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load testing election assignments');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  async function handleGenerateVotes() {
    setMessage('');
    setGenerating(true);
    try {
      const { data } = await generateTestingElectionVotes(id);
      setMessage(data.message || 'Random test votes created.');
      await loadAssignment();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to generate test votes');
    } finally {
      setGenerating(false);
    }
  }

  if (!isAdmin) {
    return <div className="page"><p className="form-error">Access denied. Admin only.</p></div>;
  }

  return (
    <section className="page">
      <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '18px' }}>
        Back
      </button>

      <header className="page-header">
        <p className="page-eyebrow">Testing election management</p>
        <h1>{election?.title || 'Testing election'}</h1>
        <p>Review the assigned voters for this testing election and generate a fresh random vote assignment.</p>
      </header>

      {loading && <p className="empty-state">Loading assigned testers...</p>}
      {error && <p className="form-error">{error}</p>}

      {election && (
        <div className="form-stack card wide-card">
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Election area</span>
              <strong className="stat-value">{election.area}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Voting type</span>
              <strong className="stat-value">{election.votingType === 'majority' ? 'Majority' : 'Rank-based'}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Assigned testers</span>
              <strong className="stat-value">{voters.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Election window</span>
              <strong className="stat-value">{formatDate(election.startDate)} – {formatDate(election.endDate)}</strong>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-start', gap: '12px' }}>
            <Button type="button" className="btn-primary" onClick={handleGenerateVotes} disabled={generating || voters.length === 0}>
              {generating ? 'Generating votes...' : 'Generate random test votes'}
            </Button>
            <Button type="button" className="btn-secondary" onClick={() => navigate(`/election/${id}`)}>
              View election details
            </Button>
          </div>

          {message && <p className={message.toLowerCase().includes('unable') ? 'form-error' : 'form-success'}>{message}</p>}
        </div>
      )}

      {election && voters.length === 0 && !loading && (
        <p className="empty-state">No verified users are assigned to this election area yet.</p>
      )}

      {election && voters.length > 0 && (
        <Card title="Assigned testers" className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Locality</th>
                  <th>Status</th>
                  <th>Assigned vote</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr key={String(voter._id)}>
                    <td>{voter.name}</td>
                    <td>{voter.email}</td>
                    <td>{voter.locality || 'Unknown'}</td>
                    <td>{voter.hasVoted ? 'Voted' : 'Pending'}</td>
                    <td>
                      {voter.voteDetails ? (
                        voter.voteDetails.type === 'majority' ? (
                          voter.voteDetails.candidateName
                        ) : (
                          voter.voteDetails.ranked.map((rank, idx) => (
                            <span key={rank.candidateId}>
                              {idx + 1}. {rank.candidateName}
                              {idx < voter.voteDetails.ranked.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        )
                      ) : (
                        <em>Not generated</em>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
