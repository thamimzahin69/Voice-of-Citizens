import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await apiClient.get('/complaints');
      setComplaints(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#ffc107';
      case 'Reviewed':
        return '#17a2b8';
      case 'Resolved':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading complaints...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#dc3545' }}>Error: {error}</div>;
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Complaints Management</h1>
        <p>Review and manage all user complaints.</p>
      </header>

      {complaints.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#6c757d',
        }}>
          <p style={{ fontSize: '16px', margin: 0 }}>No complaints submitted yet.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '16px',
        }}>
          {complaints.map(complaint => (
            <div
              key={complaint._id}
              style={{
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)')}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#333',
                  }}>
                    {complaint.subject}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#6c757d',
                  }}>
                    From: <strong>{complaint.submittedBy?.name || 'Anonymous'}</strong> ({complaint.submittedBy?.email})
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: getStatusColor(complaint.status),
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}>
                    {complaint.status}
                  </span>
                  <span style={{
                    fontSize: '20px',
                    color: '#999',
                  }}>
                    {expandedId === complaint._id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Expanded view */}
              {expandedId === complaint._id && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #eee',
                }}>
                  <div style={{
                    marginBottom: '12px',
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#667eea',
                    }}>
                      Description:
                    </h4>
                    <p style={{
                      margin: '0',
                      color: '#555',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {complaint.description}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    color: '#999',
                  }}>
                    <span>📅 Submitted: {new Date(complaint.createdAt).toLocaleString()}</span>
                    {complaint.updatedAt !== complaint.createdAt && (
                      <span>🔄 Updated: {new Date(complaint.updatedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}