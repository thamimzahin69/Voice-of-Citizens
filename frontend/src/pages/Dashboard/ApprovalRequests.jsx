import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function ApprovalRequests() {
  const [requests, setRequests] = useState([]);

  function getDocumentUrl(documentPath) {
    if (!documentPath) return null;
    const fileName = documentPath.split(/[\\/]/).pop();
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    return `${apiBase}/uploads/${fileName}`;
  }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRequestedUsers() {
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

    loadRequestedUsers();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/admin/documents/pending');
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to refresh requests.');
    } finally {
      setLoading(false);
    }
  }

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
    if (reason === null) {
      return;
    }

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
        <h1>User Registration Requests</h1>
        <p>Review pending sign-up requests and approve or reject them.</p>
      </header>

      {loading && <p>Loading registration requests…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !requests.length && <p>No pending registration requests.</p>}

      <div className="grid">
        {requests.map((request) => (
          <Card key={request._id} title={request.name} className="request-card">
            <p>
              <strong>Email:</strong> {request.email}
            </p>
            <p>
              <strong>NID:</strong> {request.nid || 'Not provided'}
            </p>
            {request.documentPath && (
              <p>
                <strong>NID Document:</strong>{' '}
                <a href={getDocumentUrl(request.documentPath)} target="_blank" rel="noopener noreferrer">
                  View/Download PDF
                </a>
              </p>
            )}
            <div className="card-actions">
              <Button type="button" onClick={() => handleApprove(request._id)} disabled={submitting}>
                Approve
              </Button>
              <Button type="button" className="secondary" onClick={() => handleReject(request._id)} disabled={submitting}>
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
