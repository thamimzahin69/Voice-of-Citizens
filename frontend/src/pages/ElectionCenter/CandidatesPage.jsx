import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './CandidatesPage.css';

export default function CandidatesPage() {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, [electionId]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      console.log('Fetching candidates for election:', electionId);
      const [candidatesRes, electionRes] = await Promise.all([
        apiClient.get(`/elections/${electionId}/candidates`),
        apiClient.get(`/elections/${electionId}`)
      ]);

      console.log('Candidates response:', candidatesRes.data);
      console.log('Election response:', electionRes.data);

      setCandidates(candidatesRes.data);
      setElection(electionRes.data);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="candidates-page">
        <div className="loading">Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidates-page">
        <div className="error">{error}</div>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="candidates-page">
      <div className="page-header">
        <h1>Candidates for {election?.title}</h1>
        <p>Review all candidates participating in this election</p>
        <Button className="btn-secondary" onClick={() => navigate(-1)}>
          Back to Election
        </Button>
      </div>

      <div className="candidates-grid">
        {candidates.map((candidate) => (
          <Card key={candidate._id} className="candidate-profile-card">
            <div className="candidate-header">
              {candidate.imageUrl && (
                <div className="candidate-image">
                  <img
                    src={candidate.imageUrl}
                    alt={`${candidate.name} profile`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="candidate-info">
                <h3 className="candidate-name">{candidate.name}</h3>
                <p className="candidate-party">
                  {candidate.party}
                  {candidate.party && candidate.party !== 'Independent' && (
                    <span className="party-badge">{candidate.party}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="candidate-details">
              <div className="detail-section">
                <h4>Manifesto</h4>
                <p className="manifesto-text">
                  {candidate.manifesto || 'No manifesto provided'}
                </p>
              </div>

              <div className="candidate-stats">
                <div className="stat-item">
                  <span className="stat-label">Current Votes:</span>
                  <span className="stat-value">{candidate.voteCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Joined:</span>
                  <span className="stat-value">
                    {new Date(candidate.joinedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="no-candidates">
          <p>No candidates have been added to this election yet.</p>
          <p>If you are an admin, you can add candidates when creating the election.</p>
          <Button onClick={() => navigate(-1)}>Back to Election</Button>
        </div>
      )}
    </div>
  );
}