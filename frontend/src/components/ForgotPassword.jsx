import { useState } from 'react';
import { API_BASE_URL } from '../config.js';

export default function ForgotPasswordPage({ onBack }) {
  const [step, setStep] = useState('form'); // form | reset | done
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  function validateFields() {
    if (!email.trim() || !employeeCode.trim()) {
      setError('Please enter both your email and employee code.');
      return false;
    }
    return true;
  }

  async function handleSendRequest() {
    setError('');
    setMessage('');
    if (!validateFields()) return;

    setIsSendingRequest(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, employeeCode }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'Could not send request.');
      setMessage(data.message);
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setIsSendingRequest(false);
    }
  }

  async function handleUpdatePasswordClick() {
    setError('');
    setMessage('');
    if (!validateFields()) return;

    setIsCheckingApproval(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, employeeCode }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not check request status.');
      }

      if (data.status === 'APPROVED') {
        setStep('reset');
      } else {
        // PENDING or REJECTED both show the same message per the required flow.
        setError('Your request is still pending approval from the admin.');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setIsCheckingApproval(false);
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset/reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, employeeCode, newPassword }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not reset password.');
      }

      setStep('done');
    } catch (err) {
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setIsResetting(false);
    }
  }

  const isBusy = isSendingRequest || isCheckingApproval;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-panel-copy">
          <div className="auth-kicker">Smart Resource Hiring</div>
          <h1 className="auth-title">
            {step === 'reset' ? 'Set Up Your New Password' : 'Forgot Password'}
          </h1>
          <p className="auth-copy">
            {step === 'reset'
              ? 'Your request was approved. Choose a new password below.'
              : 'Enter your email and employee code, then send a reset request to the admin. Once approved, click "Update Password" to set a new one.'}
          </p>
        </div>

        {step === 'form' && (
          <div className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>Employee Code</span>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
              />
            </label>

            {message ? (
              <div className="auth-credentials-value">{message}</div>
            ) : null}
            {error ? <div className="auth-error">{error}</div> : null}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="auth-submit"
                disabled={isBusy}
                onClick={handleSendRequest}
              >
                {isSendingRequest ? 'Sending...' : 'Send Request'}
              </button>

              <button
                type="button"
                className="auth-submit"
                disabled={isBusy}
                onClick={handleUpdatePasswordClick}
              >
                {isCheckingApproval ? 'Checking...' : 'Update Password'}
              </button>
            </div>

            <button type="button" className="auth-link-button" onClick={onBack}>
              Back to login
            </button>
          </div>
        )}

        {step === 'reset' && (
          <form className="auth-form" onSubmit={handleResetSubmit}>
            <label className="auth-field">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            {error ? <div className="auth-error">{error}</div> : null}

            <button
              className="auth-submit"
              type="submit"
              disabled={isResetting}
            >
              {isResetting ? 'Updating...' : 'Update Password'}
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => setStep('form')}
            >
              Back
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="auth-form">
            <div className="auth-credentials">
              <span className="auth-credentials-label">Password updated</span>
              <span className="auth-credentials-value">
                You can now sign in with your new password.
              </span>
            </div>
            <button className="auth-submit" type="button" onClick={onBack}>
              Back to login
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
