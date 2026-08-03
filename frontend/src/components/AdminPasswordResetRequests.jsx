import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config.js';

export default function AdminPasswordResetRequests({ currentUser, onBack }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('PENDING'); // PENDING | ALL
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${currentUser?.token}`,
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const url =
        filter === 'PENDING'
          ? `${API_BASE_URL}/api/admin/password-reset-requests?status=PENDING`
          : `${API_BASE_URL}/api/admin/password-reset-requests`;

      const response = await fetch(url, { headers: authHeaders });

      if (!response.ok) {
        throw new Error('Could not load password reset requests.');
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentUser?.token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(id, action) {
    setActioningId(id);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/password-reset-requests/${id}/${action}`,
        {
          method: 'POST',
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`Could not ${action} this request.`);
      }

      // Refresh the list after approving/rejecting
      await fetchRequests();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" style={{ maxWidth: '720px' }}>
        <div className="auth-panel-copy">
          <div className="auth-kicker">Smart Resource Hiring</div>
          <h1 className="auth-title">Password Reset Requests</h1>
          <p className="auth-copy">
            Review employee password reset requests below. Approve a request to
            let the employee set a new password, or reject it if it looks
            suspicious.
          </p>
        </div>

        <div className="auth-form">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              className="auth-submit"
              style={{ opacity: filter === 'PENDING' ? 1 : 0.6 }}
              onClick={() => setFilter('PENDING')}
            >
              Pending
            </button>
            <button
              type="button"
              className="auth-submit"
              style={{ opacity: filter === 'ALL' ? 1 : 0.6 }}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          {isLoading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No requests found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}
                >
                  <th style={{ padding: '8px' }}>Employee</th>
                  <th style={{ padding: '8px' }}>Code</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Requested At</th>
                  <th style={{ padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{req.employeeName}</td>
                    <td style={{ padding: '8px' }}>{req.employeeCode}</td>
                    <td style={{ padding: '8px' }}>{req.status}</td>
                    <td style={{ padding: '8px' }}>
                      {new Date(req.requestedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="auth-submit"
                            disabled={actioningId === req.id}
                            onClick={() => handleAction(req.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="auth-link-button"
                            disabled={actioningId === req.id}
                            onClick={() => handleAction(req.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button type="button" className="auth-link-button" onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </section>
    </main>
  );
}
