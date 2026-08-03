import { useState } from 'react';
import SRHHomepage from './components/SRHHomepage.jsx';
import DemandManagement from './components/DemandManagement.jsx';
import CandidateInterviewStatus from './components/CandidateInterviewStatus.jsx';
import ClientInterviewManagement from './components/ClientInterviewManagement.jsx';
import ForgotPasswordPage from './components/ForgotPassword.jsx';
import './components/SRHHomepage.css';
import { API_BASE_URL } from './config.js';
import AdminPasswordResetRequests from './components/AdminPasswordResetRequests.jsx';



function LoginPage({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Check your email and password.');
      }

      const data = await response.json();
      localStorage.setItem('srhAuth', JSON.stringify(data));
      onLogin(data);
    } catch (error) {
      setStatus(error.message || 'Could not connect to the backend.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-panel-copy">
          <div className="auth-kicker">Smart Resource Hiring</div>
          <h1 className="auth-title">Sign in to SRH Portal</h1>
          <p className="auth-copy">
            Access the hiring workspace with your SRH account. Sign in to manage
            people, projects, and interviews from one place.
          </p>
          <div className="auth-highlights" aria-label="Platform highlights">
            <span>Secure JWT session</span>
            <span>Role-based access</span>
            <span>Unified workflow</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-credentials">
            <span className="auth-credentials-label">Demo credentials</span>
            <span className="auth-credentials-value">
              admin@example.com / admin123
            </span>
          </div>

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
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {status ? <div className="auth-error">{status}</div> : null}

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type="button"
            className="auth-link-button"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </form>
      </section>
    </main>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('srhAuth');
    return saved ? JSON.parse(saved) : null;
  });

  const [page, setPage] = useState('home');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  function handleLogout() {
    localStorage.removeItem('srhAuth');
    setAuth(null);
    setPage('home');
  }

  if (!auth?.token) {
    if (showForgotPassword) {
      return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
    }
    return (
      <LoginPage
        onLogin={setAuth}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  if (
    page === 'password-resets' &&
    ['ADMIN', 'PROJECT_ADMINISTRATOR'].includes(auth.role)
  ) {
    return (
      <AdminPasswordResetRequests
        currentUser={auth}
        onBack={() => setPage('home')}
      />
    );
  }

  if (auth.role === 'CLIENT') {
    return (
      <ClientInterviewManagement currentUser={auth} onLogout={handleLogout} />
    );
  }

  if (page === 'demand') {
    return (
      <DemandManagement
        currentUser={auth}
        onBack={() => setPage('home')}
        onLogout={handleLogout}
      />
    );
  }

  if (page === 'interviews' && auth.role === 'EMPLOYEE') {
    return (
      <CandidateInterviewStatus
        onBack={() => setPage('home')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <SRHHomepage
      currentUser={auth}
      onLogout={handleLogout}
      onGoToDemand={() => setPage('demand')}
      onGoToInterviews={() => setPage('interviews')}
      onGoToPasswordResets={() => setPage('password-resets')}
    />
  );
}
