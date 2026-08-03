import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config.js';

const ROUND_ORDER = ['L1', 'L2', 'HR'];

const ROUND_LABELS = {
  L1: 'L1 Technical Round',
  L2: 'L2 Technical Round',
  HR: 'Final HR Round',
};

const STATUS_LABELS = {
  SCHEDULED: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Failed',
};

const STATUS_CLASS = {
  SCHEDULED: 'scheduled',
  PASSED: 'passed',
  FAILED: 'failed',
};

function authToken() {
  try {
    const auth = JSON.parse(localStorage.getItem('srhAuth') || '{}');
    return auth.token || '';
  } catch {
    return '';
  }
}

function roundIndex(round) {
  return ROUND_ORDER.indexOf(round);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByProject(interviews) {
  const map = new Map();

  interviews.forEach((interview) => {
    if (!map.has(interview.projectId)) {
      map.set(interview.projectId, {
        projectId: interview.projectId,
        projectName: interview.projectName,
        interviews: [],
      });
    }
    map.get(interview.projectId).interviews.push(interview);
  });

  return [...map.values()].map((group) => ({
    ...group,
    interviews: [...group.interviews].sort(
      (a, b) => roundIndex(a.round) - roundIndex(b.round),
    ),
  }));
}

function projectStatus(group) {
  const hrPassed = group.interviews.some(
    (interview) => interview.round === 'HR' && interview.status === 'PASSED',
  );
  if (hrPassed) return 'ALLOCATED';

  if (group.interviews.some((interview) => interview.status === 'FAILED')) {
    return 'IN_PROGRESS';
  }

  if (group.interviews.some((interview) => interview.status === 'SCHEDULED')) {
    return 'IN_PROGRESS';
  }

  return 'PENDING';
}

function allowedRounds(interviews) {
  const seen = new Set();
  const visible = [];

  for (const interview of interviews) {
    if (seen.has(interview.round)) continue;
    visible.push(interview.round);
    seen.add(interview.round);

    if (interview.status !== 'PASSED') {
      break;
    }
  }

  return visible;
}

function StatusBadge({ status }) {
  const state = STATUS_CLASS[status] || 'scheduled';
  return (
    <span className={`im-badge im-badge-${state}`}>
      {STATUS_LABELS[status] || 'Pending'}
    </span>
  );
}

function TimelineCard({ group, assignment }) {
  const unlocked = useMemo(
    () => allowedRounds(group.interviews),
    [group.interviews],
  );
  const isAllocated = projectStatus(group) === 'ALLOCATED';

  return (
    <article className="im-timeline-card">
      <div className="im-timeline-header">
        <div>
          <div className="im-timeline-name">{group.projectName}</div>
          <div className="im-timeline-project">Interview progression</div>
          {assignment ? (
            <div className="im-timeline-client-info">
              {assignment.clientName ? (
                <div className="im-timeline-client">
                  Client: {assignment.clientName}
                </div>
              ) : null}
              {assignment.projectDescription ? (
                <div className="im-timeline-description">
                  {assignment.projectDescription}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {isAllocated ? (
          <span className="im-allocated-badge">✓ ALLOCATED</span>
        ) : null}
      </div>

      <div className="im-timeline-rounds">
        {group.interviews.map((interview) => (
          <div
            key={interview.id}
            className={`im-round-step im-round-active ${
              interview.status === 'PASSED'
                ? 'im-round-passed'
                : interview.status === 'FAILED'
                  ? 'im-round-failed'
                  : ''
            }`}
          >
            <div className="im-round-dot">
              {interview.status === 'PASSED'
                ? '✓'
                : interview.status === 'FAILED'
                  ? '✗'
                  : interview.round}
            </div>
            <div className="im-round-body">
              <div className="im-round-label">
                {ROUND_LABELS[interview.round]}
              </div>
              <div className="im-round-time">
                {formatDate(interview.scheduledAt)}
              </div>
              <StatusBadge status={interview.status} />
            </div>
          </div>
        ))}

        {unlocked.length > 0 && unlocked.length < ROUND_ORDER.length ? (
          <div className="im-next-round-bar">
            <span>
              {ROUND_LABELS[unlocked[unlocked.length - 1]]} is complete. Next
              round unlocks after passing it.
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function CandidateInterviewStatus({ onBack, onLogout }) {
  const [interviews, setInterviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const token = authToken();
        const [interviewsResponse, profileResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/interviews/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/employees/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!interviewsResponse.ok) {
          const payload = await interviewsResponse.json().catch(() => null);
          throw new Error(
            payload?.message || 'Unable to load interview results.',
          );
        }
        if (!profileResponse.ok) {
          throw new Error('Unable to load profile details.');
        }
        const [data, profileData] = await Promise.all([
          interviewsResponse.json(),
          profileResponse.json(),
        ]);
        setInterviews(data);
        setProfile(profileData);
      } catch (err) {
        setError(err.message || 'Unable to load interview results.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const grouped = useMemo(() => groupByProject(interviews), [interviews]);
  const totalPassed = interviews.filter(
    (interview) => interview.status === 'PASSED',
  ).length;
  const totalFailed = interviews.filter(
    (interview) => interview.status === 'FAILED',
  ).length;
  const allocated = grouped.filter(
    (group) => projectStatus(group) === 'ALLOCATED',
  ).length;

  return (
    <main className="im-page">
      <style>{`
.im-page {
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ---------- Top nav ---------- */

.im-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #10161d;
  border-bottom: 1px solid #1e2a35;
  position: sticky;
  top: 0;
  z-index: 10;
}

.im-nav-title {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
  color: #00d4ff;
}

.im-back {
  background: transparent;
  border: 1px solid #2a3844;
  color: #c3cdd6;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.im-back:hover {
  border-color: #00d4ff;
  color: #00d4ff;
}

.im-logout {
  background: transparent;
  border: 1px solid #2a3844;
  color: #c3cdd6;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.im-logout:hover {
  border-color: #ff5f57;
  color: #ff5f57;
}

/* ---------- Page content ---------- */

.im-content {
  padding: 32px;
  max-width: 1180px;
  margin: 0 auto;
}

.im-heading h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #f4f8fb;
}

.im-heading p {
  margin: 0 0 20px;
  color: #8b98a5;
  font-size: 14px;
  max-width: 640px;
}

/* ---------- Alerts ---------- */

.im-alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
}

.im-alert-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #6ee7a0;
}

.im-error {
  background: rgba(255, 95, 87, 0.1);
  border: 1px solid rgba(255, 95, 87, 0.35);
  color: #ff8f89;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
}

/* ---------- Metrics ---------- */

.im-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.im-metric-card {
  background: #11181f;
  border: 1px solid #1e2a35;
  border-radius: 12px;
  padding: 18px 20px;
  border-top: 3px solid transparent;
}

.im-metric-cyan { border-top-color: #00d4ff; }
.im-metric-blue { border-top-color: #4f8cff; }
.im-metric-green { border-top-color: #22c55e; }
.im-metric-gold { border-top-color: #eab308; }

.im-metric-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #f4f8fb;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.im-metric-label {
  font-size: 13px;
  font-weight: 600;
  color: #c3cdd6;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.im-metric-sub {
  font-size: 12px;
  color: #6b7885;
  margin-top: 2px;
}

.im-loading {
  color: #8b98a5;
  padding: 40px 0;
  text-align: center;
}

/* ---------- Empty state ---------- */

.im-empty {
  text-align: center;
  padding: 64px 24px;
  border: 1px dashed #2a3844;
  border-radius: 12px;
  color: #8b98a5;
}

.im-empty h3 {
  color: #f4f8fb;
  margin: 0 0 6px;
}

.im-empty p {
  margin: 0;
  font-size: 14px;
}

/* ---------- Timeline cards ---------- */

.im-timelines {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.im-timeline-card {
  background: #11181f;
  border: 1px solid #1e2a35;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.im-timeline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.im-timeline-name {
  font-weight: 700;
  font-size: 16px;
  color: #f4f8fb;
}

.im-timeline-project {
  font-size: 13px;
  color: #8b98a5;
  margin-top: 2px;
}

.im-timeline-client-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #1e2a35;
}

.im-timeline-client {
  font-size: 12px;
  font-weight: 600;
  color: #00d4ff;
  margin-bottom: 4px;
}

.im-timeline-description {
  font-size: 12px;
  color: #8b98a5;
  line-height: 1.5;
}

.im-allocated-badge {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* ---------- Round steps ---------- */

.im-timeline-rounds {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.im-round-step {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}

.im-round-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 13px;
  top: 34px;
  bottom: -8px;
  width: 2px;
  background: #1e2a35;
}

.im-round-dot {
  flex: 0 0 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a232c;
  border: 2px solid #2a3844;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #8b98a5;
  z-index: 1;
}

.im-round-passed .im-round-dot {
  background: rgba(34, 197, 94, 0.16);
  border-color: #22c55e;
  color: #22c55e;
}

.im-round-failed .im-round-dot {
  background: rgba(255, 95, 87, 0.14);
  border-color: #ff5f57;
  color: #ff5f57;
}

.im-round-active .im-round-dot {
  border-color: #00d4ff;
  color: #00d4ff;
}

.im-round-body {
  flex: 1;
  padding-top: 2px;
}

.im-round-label {
  font-size: 13px;
  font-weight: 600;
  color: #d6dee5;
  margin-bottom: 2px;
}

.im-round-time {
  font-size: 12px;
  color: #6b7885;
  margin: 2px 0 6px;
}

/* ---------- Status badge (candidate view) ---------- */

.im-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.im-badge-scheduled {
  background: rgba(0, 212, 255, 0.14);
  color: #00d4ff;
}

.im-badge-passed {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
}

.im-badge-failed {
  background: rgba(255, 95, 87, 0.14);
  color: #ff5f57;
}

/* ---------- Next-round info bar ---------- */

.im-next-round-bar {
  border-top: 1px solid #1e2a35;
  padding-top: 14px;
  font-size: 13px;
  color: #8b98a5;
}

/* ---------- Responsive ---------- */

@media (max-width: 900px) {
  .im-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .im-content {
    padding: 20px;
  }
  .im-metrics {
    grid-template-columns: 1fr;
  }
  .im-nav {
    padding: 14px 16px;
  }
}
      `}</style>

      <nav className="im-nav">
        <button className="im-back" onClick={onBack} type="button">
          ← Back
        </button>
        <div className="im-nav-title">My Interview Status</div>
        <button className="im-logout" onClick={onLogout} type="button">
          Sign out
        </button>
      </nav>

      <section className="im-content">
        <div className="im-heading">
          <div>
            <h1>My interview progress</h1>
            <p>
              You can only see the rounds you have unlocked. L2 appears after L1
              is passed, and HR appears after L2 is passed.
            </p>
          </div>
        </div>

        {profile?.status === 'SHORTLISTED' ? (
          <div className="im-alert im-alert-success">
            You have been shortlisted. Your client can now schedule your
            interview rounds.
          </div>
        ) : null}

        <div className="im-metrics">
          <div className="im-metric-card im-metric-cyan">
            <div className="im-metric-value">{grouped.length}</div>
            <div className="im-metric-label">Projects</div>
            <div className="im-metric-sub">Interview tracks</div>
          </div>
          <div className="im-metric-card im-metric-green">
            <div className="im-metric-value">{totalPassed}</div>
            <div className="im-metric-label">Rounds Passed</div>
            <div className="im-metric-sub">Cleared so far</div>
          </div>
          <div className="im-metric-card im-metric-blue">
            <div className="im-metric-value">{totalFailed}</div>
            <div className="im-metric-label">Rounds Failed</div>
            <div className="im-metric-sub">Final outcome recorded</div>
          </div>
          <div className="im-metric-card im-metric-gold">
            <div className="im-metric-value">{allocated}</div>
            <div className="im-metric-label">Allocated</div>
            <div className="im-metric-sub">HR cleared</div>
          </div>
        </div>

        {loading ? (
          <div className="im-loading">Loading…</div>
        ) : error ? (
          <div className="im-error">{error}</div>
        ) : grouped.length === 0 ? (
          <div className="im-empty">
            <h3>No interviews scheduled</h3>
            <p>Your interview details will appear here when available.</p>
          </div>
        ) : (
          <div className="im-timelines">
            {grouped.map((group) => (
              <TimelineCard
                key={group.projectId}
                group={group}
                assignment={profile?.projectAssignments?.find(
                  (a) => a.projectId === group.projectId,
                )}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
