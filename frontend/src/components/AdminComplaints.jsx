import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';
import Card from './ui/Card';

function statusClass(status = '') {
  const value = status.toLowerCase();
  if (value.includes('resolved')) return 'badge-resolved';
  if (value.includes('review')) return 'badge-review';
  if (value.includes('reject')) return 'badge-rejected';
  return 'badge-pending';
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);
        setError('');
        const { data } = await apiClient.get('/complaints');
        setComplaints(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return complaints;
    return complaints.filter((item) => (item.status || '').toLowerCase() === filter);
  }, [complaints, filter]);

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Admin review</p>
        <h1>Complaints</h1>
        <p>View all complaints, filter by status, and open details for response workflows.</p>
      </header>

      <Card>
        <label className="form-field">
          <span className="form-label">Filter complaints by status</span>
          <select className="form-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </Card>

      {loading && <p className="empty-state">Loading complaints...</p>}
      {error && <p className="form-error">Error: {error}</p>}

      {!loading && filtered.length === 0 ? (
        <p className="empty-state">No complaints submitted yet.</p>
      ) : (
        <div className="grid" style={{ marginTop: '18px' }}>
          {filtered.map((complaint) => (
            <Card key={complaint._id} title={complaint.subject || complaint.title || 'Complaint'}>
              <div className="card-actions">
                <span className={`badge ${statusClass(complaint.status)}`}>{complaint.status || 'Pending'}</span>
                <button type="button" className="btn btn-secondary" onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}>
                  {expandedId === complaint._id ? 'Close details' : 'Open details'}
                </button>
              </div>
              <p>From: <strong>{complaint.submittedBy?.name || 'Anonymous'}</strong> {complaint.submittedBy?.email ? `(${complaint.submittedBy.email})` : ''}</p>
              {expandedId === complaint._id && (
                <div className="notice">
                  <strong>Description</strong>
                  <p>{complaint.description}</p>
                  <small>Submitted: {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'Not available'}</small>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
