import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';

function formatDate(date) {
  if (!date) return 'Not available';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleDateString();
}

export default function Overview() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const promises = [apiClient.get('/dashboard/overview'), apiClient.get('/elections/history')];
        if (isAdmin) promises.push(apiClient.get('/admin/documents/pending'));
        const [statsRes, historyRes, pendingRes] = await Promise.allSettled(promises);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data.slice(0, 5));
        if (pendingRes?.status === 'fulfilled') setPendingCount(pendingRes.value.data.length);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  const cards = useMemo(() => {
    if (isAdmin) {
      return [
        { icon: 'Ballot', label: 'Active Elections', value: stats?.activeElections },
        { icon: 'Votes', label: 'Total Votes', value: stats?.totalVotes ?? stats?.yourVotes },
        { icon: 'Cases', label: 'Open Complaints', value: stats?.openComplaints },
        { icon: 'Queue', label: 'Pending Registrations', value: pendingCount },
      ];
    }
    return [
      { icon: 'Ballot', label: 'Active Elections', value: stats?.activeElections },
      { icon: 'Joined', label: 'Elections Joined', value: stats?.joinedElections ?? history.length },
      { icon: 'Votes', label: 'Votes Cast', value: stats?.yourVotes },
      { icon: 'Cases', label: 'Open Complaints', value: stats?.openComplaints },
    ];
  }, [history.length, isAdmin, pendingCount, stats]);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">{isAdmin ? 'Administrator' : 'Citizen'} workspace</p>
        <h1>Dashboard Overview</h1>
        <p>Quick stats about your voting activity and current elections.</p>
      </header>

      {loading && <p className="empty-state">Loading dashboard data...</p>}

      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <span className="stat-icon">{card.icon}</span>
            <strong className="stat-value">{card.value ?? '-'}</strong>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="profile-grid" style={{ marginTop: '18px' }}>
        <Card title="My Profile">
          <div className="profile-grid" style={{ gridTemplateColumns: 'auto 1fr' }}>
            <div className="profile-avatar">{(user?.name || user?.email || 'VC').slice(0, 2).toUpperCase()}</div>
            <div className="detail-list">
              <div className="detail-row"><span>Full name</span><span>{user?.name || 'Not provided'}</span></div>
              <div className="detail-row"><span>Email</span><span>{user?.email || 'Not provided'}</span></div>
              <div className="detail-row"><span>NID number</span><span>{user?.nid || 'Not provided'}</span></div>
              <div className="detail-row"><span>Area</span><span>{user?.area || 'Not provided'}</span></div>
              <div className="detail-row"><span>Role</span><span>{isAdmin ? 'Admin' : 'User'}</span></div>
              <div className="detail-row"><span>Registration status</span><span>{user?.status || user?.documentStatus || 'Active'}</span></div>
              <div className="detail-row"><span>Account created</span><span>{formatDate(user?.createdAt)}</span></div>
            </div>
          </div>
        </Card>

        <Card title="Recent Voting History">
          {history.length === 0 ? (
            <p className="empty-state">No voting history yet. Join an election to get started.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Election</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>
                      <td>{item.title}</td>
                      <td>{formatDate(item.endDate || item.startDate)}</td>
                      <td><span className="badge badge-voted">{item.hasVoted ? 'Voted' : item.status || 'Not voted'}</span></td>
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
