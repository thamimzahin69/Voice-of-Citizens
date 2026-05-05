import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

export default function ApprovalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function getDocumentUrl(documentPath) {
    if (!documentPath) return null;
    const fileName = documentPath.split(/[\\/]/).pop();
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    return `${apiBase}/uploads/${fileName}`;
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/admin/documents/pending');
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to load pending registration requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleApprove(userId) {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/admin/documents/${userId}/verify`);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to approve registration request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(userId) {
    const reason = window.prompt('Optional rejection reason:', 'Insufficient information');
    if (reason === null) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/admin/documents/${userId}/reject`, { reason });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to reject registration request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">Identity review</p>
        <h1>Review User Registration</h1>
        <p>Review pending voter registrations, inspect NID documents, and approve or reject access.</p>
      </header>

      {loading && <p className="empty-state">Loading registration requests...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !requests.length && <p className="empty-state">No pending registrations.</p>}

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {requests.map((request) => (
          <div
            key={request._id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                {request.name}
              </h3>
            </div>

            <div style={{ display: 'grid', gap: '12px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Email</span>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>{request.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>NID number</span>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                  {request.nid || 'Not provided'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Registration date</span>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Not available'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Status</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#fef08a',
                    color: '#78350f',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    width: 'fit-content',
                  }}
                >
                  Pending
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              {request.documentPath && (
                <a
                  href={getDocumentUrl(request.documentPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '10px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#3b82f6',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e0e7ff';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.borderColor = '#cbd5e1';
                  }}
                >
                  View document
                </a>
              )}
              <button
                onClick={() => handleApprove(request._id)}
                disabled={submitting}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px 16px',
                  backgroundColor: '#5b21b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = '#7c3aed';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(91, 33, 182, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#5b21b6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(request._id)}
                disabled={submitting}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px 16px',
                  backgroundColor: '#fecaca',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = '#fca5a5';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fecaca';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
