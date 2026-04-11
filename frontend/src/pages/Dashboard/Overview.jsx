import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';

export default function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await apiClient.get('/dashboard/overview');
        setStats(data);
      } catch (err) {
        console.error(err);
        setStats(null);
      }
    }

    load();
  }, []);

  const StatCard = ({ icon, title, value, color = 'primary-blue' }) => (
    <Card className="stat-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          fontSize: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#999',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.5px',
          }}>
            {title}
          </p>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '32px',
            fontWeight: '800',
            color: 'var(--gray-darker)',
            background: 'var(--primary-gradient)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {value ?? '—'}
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <section className="page">
      <header className="page-header">
        <h1>📊 Dashboard Overview</h1>
        <p>Quick stats about your voting activity and current elections.</p>
      </header>

      <div className="grid" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      }}>
        <StatCard 
          icon="🗳️" 
          title="Active Elections" 
          value={stats?.activeElections ?? '—'}
        />
        <StatCard 
          icon="✓" 
          title="Your Votes" 
          value={stats?.yourVotes ?? '—'}
        />
        <StatCard 
          icon="💬" 
          title="Open Complaints" 
          value={stats?.openComplaints ?? '—'}
        />
      </div>

      <div style={{ marginTop: '40px' }}>
        <Card className="welcome-card">
          <h2 style={{
            marginTop: 0,
            marginBottom: '12px',
            fontSize: '24px',
            fontWeight: '700',
            background: 'var(--primary-gradient)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🎉 Welcome Back!
          </h2>
          <p style={{
            color: 'var(--gray-text)',
            lineHeight: '1.8',
            marginBottom: '16px',
          }}>
            Use the sidebar to navigate through elections, view voting history, submit complaints, or access admin features if you're an administrator.
          </p>
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '12px',
            borderLeft: '4px solid var(--primary-blue)',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray-darker)', fontWeight: '500' }}>
              💡 Tip: Click on any election card to view details, candidates, and cast your vote.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
