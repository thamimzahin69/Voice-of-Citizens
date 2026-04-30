import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';

function badgeClass(eventType) {
  if (eventType === 'login') return 'badge-approved';
  if (eventType === 'vote') return 'badge-voted';
  if (eventType === 'complaint') return 'badge-pending';
  if (eventType === 'chat') return 'badge-info';
  if (eventType === 'logout') return 'badge-review';
  return 'badge-review';
}

export default function UserLog() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedUser = useMemo(() => users.find((item) => item._id === selectedUserId), [selectedUserId, users]);

  const totals = useMemo(() => logs.reduce((acc, item) => {
    acc[item.eventType] = (acc[item.eventType] || 0) + 1;
    return acc;
  }, {}), [logs]);

  const loadMyLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get('/activity-logs/me');
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your activity history.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get('/activity-logs/users');
      setUsers(data);

      const initialUserId = data.find((item) => item._id === user?._id)?._id || data[0]?._id || '';
      setSelectedUserId(initialUserId);

      if (initialUserId) {
        const logsResponse = await apiClient.get('/activity-logs', { params: { userId: initialUserId } });
        setLogs(logsResponse.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load activity history.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      loadMyLogs();
    }
  }, [isAdmin, loadAdminData, loadMyLogs]);

  async function handleUserChange(event) {
    const nextUserId = event.target.value;
    setSelectedUserId(nextUserId);

    if (!nextUserId) {
      setLogs([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.get('/activity-logs', { params: { userId: nextUserId } });
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load activity history.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">System activity</p>
        <h1>User Log</h1>
        <p>{isAdmin ? 'Select a user to inspect their activity history.' : 'Review your own activity history.'}</p>
      </header>

      <div className="dashboard-grid">
        <Card title="User selection">
          {isAdmin ? (
            <label className="form-field">
              <span className="form-label">Choose a user</span>
              <select className="form-input" value={selectedUserId} onChange={handleUserChange} disabled={loading}>
                <option value="">Select a user</option>
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} {item.email ? `(${item.email})` : ''} {item.logCount ? `- ${item.logCount} logs` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="detail-list">
              <div className="detail-row"><span>User</span><span>{user?.name || 'Current user'}</span></div>
              <div className="detail-row"><span>Email</span><span>{user?.email || 'Not available'}</span></div>
              <div className="detail-row"><span>Role</span><span>{user?.role || 'User'}</span></div>
            </div>
          )}

          {selectedUser && isAdmin && (
            <p className="empty-state" style={{ marginTop: '12px' }}>
              Viewing logs for {selectedUser.name} {selectedUser.email ? `(${selectedUser.email})` : ''}.
            </p>
          )}

          <div className="detail-list" style={{ marginTop: '18px' }}>
            <div className="detail-row"><span>Total events</span><span>{logs.length}</span></div>
            <div className="detail-row"><span>Logins</span><span>{totals.login || 0}</span></div>
            <div className="detail-row"><span>Votes</span><span>{totals.vote || 0}</span></div>
            <div className="detail-row"><span>Complaints</span><span>{totals.complaint || 0}</span></div>
            <div className="detail-row"><span>Chat messages</span><span>{totals.chat || 0}</span></div>
          </div>
        </Card>

        <Card title="Activity history">
          {loading && <p className="empty-state">Loading activity history...</p>}
          {error && <p className="form-error">{error}</p>}
          {!loading && !logs.length && <p className="empty-state">No activity logs found for this user.</p>}

          {!loading && logs.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td><span className={`badge ${badgeClass(log.eventType)}`}>{log.eventType}</span></td>
                      <td>{log.action}</td>
                      <td>{log.details || 'No details recorded'}</td>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.source || 'backend'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
