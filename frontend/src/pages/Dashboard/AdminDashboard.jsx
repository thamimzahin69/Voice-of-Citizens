import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminDashboard() {
  const [elections, setElections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteModal, setInviteModal] = useState({ show: false, electionId: null, electionTitle: '' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [electionsRes, usersRes] = await Promise.all([
          apiClient.get('/elections'),
          apiClient.get('/admin/users')
        ]);
        setElections(electionsRes.data);
        setUsers(usersRes.data);
      } catch {
        setError('Unable to load data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleInviteUsers() {
    if (!inviteModal.electionId || selectedUsers.length === 0) return;

    setInviting(true);
    try {
      await apiClient.post(`/elections/${inviteModal.electionId}/invite`, {
        userIds: selectedUsers
      });
      setInviteModal({ show: false, electionId: null, electionTitle: '' });
      setSelectedUsers([]);
      // Refresh elections to show updated invited users count
      const { data } = await apiClient.get('/elections');
      setElections(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite users');
    } finally {
      setInviting(false);
    }
  }

  function openInviteModal(election) {
    setInviteModal({ show: true, electionId: election._id, electionTitle: election.title });
    setSelectedUsers([]);
  }

  function toggleUserSelection(userId) {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/elections');
        setElections(data);
      } catch {
        setError('Unable to load elections.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Admin command center</p>
        <h1>Admin Dashboard</h1>
        <p>Manage elections, candidates, registration review, and bulk user operations.</p>
      </header>

      <div className="page-actions" style={{ marginBottom: '18px' }}>
        <Link to="create" className="btn">Create Election</Link>
        <Link to="approvals" className="btn btn-secondary">Review User Registration</Link>
        <Link to="bulk-users" className="btn btn-secondary">Bulk Add User</Link>
      </div>

      {loading && <p className="empty-state">Loading elections...</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid">
        {elections.length === 0 && !loading ? (
          <p className="empty-state">No elections created yet.</p>
        ) : (
          elections.map((election) => (
            <Card key={election._id} title={election.title} className="election-card">
              <p>{election.description || 'No description provided.'}</p>
              <p>
                <strong>Window:</strong> {new Date(election.startDate).toLocaleString()} to{' '}
                {new Date(election.endDate).toLocaleString()}
              </p>
              <p><strong>Area:</strong> {election.area}</p>
              <p><strong>Election mode:</strong> {election.mode === 'testing' ? 'Testing' : 'Actual'}</p>
              <p><strong>Voting Type:</strong> {election.votingType === 'majority' ? 'Majority Voting' : 'Rank Based Voting'}</p>
              <p><strong>Invited Users:</strong> {election.invitedUsers?.length || 0}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button onClick={() => openInviteModal(election)} className="btn-secondary">
                  Invite Voters
                </Button>
                <Link to={`/election/${election._id}`} className="btn btn-outline">
                  View Details
                </Link>
                {election.mode === 'testing' && (
                  <Link to={`/election/${election._id}/testing`} className="btn btn-warning">
                    Manage Testing
                  </Link>
                )}
              </div>
              <span className="badge badge-info">{election.status || 'Configured'}</span>
            </Card>
          ))
        )}
      </div>

      {/* Invite Users Modal */}
      {inviteModal.show && (
        <div className="modal-overlay" onClick={() => setInviteModal({ show: false, electionId: null, electionTitle: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Invite Voters to "{inviteModal.electionTitle}"</h3>
            <p>Select users to invite to this election:</p>

            <div className="user-list" style={{ maxHeight: '300px', overflowY: 'auto', margin: '16px 0' }}>
              {users.filter(user => user.documentStatus === 'verified').map(user => (
                <label key={user._id} className="checkbox-item" style={{ display: 'block', margin: '8px 0', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                  />
                  <span style={{ marginLeft: '8px' }}>
                    <strong>{user.name}</strong> - {user.email} ({user.area})
                  </span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setInviteModal({ show: false, electionId: null, electionTitle: '' })}
                className="btn-secondary"
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUsers}
                disabled={selectedUsers.length === 0 || inviting}
              >
                {inviting ? 'Inviting...' : `Invite ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
