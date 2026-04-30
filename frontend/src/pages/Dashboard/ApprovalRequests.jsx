import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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

      <div className="grid">
        {requests.map((request) => (
          <Card key={request._id} title={request.name} className="request-card">
            <div className="detail-list">
              <div className="detail-row"><span>Email</span><span>{request.email}</span></div>
              <div className="detail-row"><span>NID number</span><span>{request.nid || 'Not provided'}</span></div>
              <div className="detail-row"><span>Registration date</span><span>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Not available'}</span></div>
              <div className="detail-row"><span>Status</span><span className="badge badge-pending">Pending</span></div>
            </div>
            <div className="card-actions">
              {request.documentPath && (
                <a className="btn btn-secondary" href={getDocumentUrl(request.documentPath)} target="_blank" rel="noopener noreferrer">
                  View document
                </a>
              )}
              <Button type="button" onClick={() => handleApprove(request._id)} disabled={submitting}>Approve</Button>
              <Button type="button" className="btn-danger" onClick={() => handleReject(request._id)} disabled={submitting}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
