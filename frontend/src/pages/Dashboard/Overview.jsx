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

  return (
    <section className="page">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Quick stats about your activity and current election state.</p>
      </header>
      <div className="grid">
        <Card title="Active Elections">
          <p>{stats?.activeElections ?? '—'}</p>
        </Card>
        <Card title="Your Votes">
          <p>{stats?.yourVotes ?? '—'}</p>
        </Card>
        <Card title="Open Complaints">
          <p>{stats?.openComplaints ?? '—'}</p>
        </Card>
      </div>
    </section>
  );
}
