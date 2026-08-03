import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config.js';

const ROUND_ORDER = ['L1', 'L2', 'HR'];

const ROUND_LABELS = {
  L1: 'L1 Technical Round',
  L2: 'L2 Technical Round',
  HR: 'Final HR Round',
};

const STATUS_STYLES = {
  SCHEDULED: {
    bg: 'rgba(0,212,255,0.12)',
    color: '#00d4ff',
    label: 'Scheduled',
  },
  PASSED: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Passed' },
  FAILED: { bg: 'rgba(255,95,87,0.10)', color: '#ff5f57', label: 'Failed' },
};

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function fmtDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function employeeName(employee) {
  return (
    [
      employee?.firstName || employee?.employeeFirstName,
      employee?.lastName || employee?.employeeLastName,
    ]
      .filter(Boolean)
      .join(' ') ||
    employee?.email ||
    employee?.employeeEmail ||
    'Employee'
  );
}

function roundIndex(round) {
  return ROUND_ORDER.indexOf(round);
}

function parseIds(value) {
  return String(value || '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter(Boolean);
}

// Groups raw interview rows into one card per (employee, project, requirement)
// combo. Every round (L1/L2/HR) for that trio lands on the same card.
function groupInterviews(interviews) {
  const grouped = new Map();

  interviews.forEach((interview) => {
    const key = `${interview.employeeId}::${interview.projectId}::${interview.requirementId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        employeeId: interview.employeeId,
        projectId: interview.projectId,
        requirementId: interview.requirementId,
        requirementRoleName: interview.requirementRoleName,
        employeeName: employeeName(interview),
        projectName: interview.projectName,
        interviews: [],
      });
    }
    grouped.get(key).interviews.push(interview);
  });

  return [...grouped.values()].map((group) => ({
    ...group,
    interviews: [...group.interviews].sort(
      (a, b) => roundIndex(a.round) - roundIndex(b.round),
    ),
  }));
}

// The main simplification: instead of one flat pile of candidate cards,
// everything is organized as Project -> Requirement -> Candidates. Each
// requirement is fully self-contained (its own headcount, its own fill
// count) - candidates on other requirements never affect it.
function buildRequirementBoard(projects, groupedInterviews) {
  return projects
    .map((project) => {
      const requirements = (project.requirements || []).map((requirement) => {
        const candidates = groupedInterviews.filter(
          (group) =>
            group.projectId === project.id &&
            group.requirementId === requirement.id,
        );
        const total = requirement.numberOfPeople ?? 0;
        const filled =
          requirement.allocatedCount ??
          candidates.filter((group) =>
            group.interviews.some(
              (i) => i.round === 'HR' && i.status === 'PASSED',
            ),
          ).length;
        return {
          requirementId: requirement.id,
          roleName: requirement.roleName,
          total,
          filled,
          pending: Math.max(total - filled, 0),
          candidates,
        };
      });
      return {
        projectId: project.id,
        projectName: project.name || project.projectName,
        requirements,
      };
    })
    .filter((project) => project.requirements.length > 0);
}

function StatusPill({ status }) {
  const meta = STATUS_STYLES[status] || STATUS_STYLES.SCHEDULED;
  return (
    <span
      className="im-badge"
      style={{
        background: meta.bg,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

function ScheduleModal({
  title,
  shortlistedEmployees,
  projects,
  defaultEmployeeId,
  defaultProjectId,
  defaultRequirementId,
  defaultRound,
  onClose,
  onSave,
  isSaving,
}) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || '');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [requirementId, setRequirementId] = useState(
    defaultRequirementId || '',
  );
  const [round, setRound] = useState(defaultRound || 'L1');
  const [scheduledAt, setScheduledAt] = useState('');

  const canPickProject = !defaultProjectId;
  const canPickRequirement = !defaultRequirementId;
  const canPickEmployee = !defaultEmployeeId;

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === Number(projectId)),
    [projectId, projects],
  );

  const requirementOptions = selectedProject?.requirements || [];

  const selectedRequirement = useMemo(
    () =>
      requirementOptions.find(
        (requirement) => requirement.id === Number(requirementId),
      ),
    [requirementOptions, requirementId],
  );

  // Only employees shortlisted specifically for THIS requirement - not
  // everyone shortlisted anywhere on the project.
  const eligibleEmployees = useMemo(() => {
    if (!selectedRequirement) return [];
    const assignedIds = new Set(
      parseIds(selectedRequirement.assignedEmployeeIds),
    );
    return shortlistedEmployees.filter((employee) =>
      assignedIds.has(employee.id),
    );
  }, [selectedRequirement, shortlistedEmployees]);

  const handleProjectChange = (value) => {
    setProjectId(value);
    setRequirementId('');
    setEmployeeId('');
  };

  const handleRequirementChange = (value) => {
    setRequirementId(value);
    setEmployeeId('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!employeeId || !projectId || !requirementId || !scheduledAt) return;
    onSave({
      employeeId: Number(employeeId),
      projectId: Number(projectId),
      requirementId: Number(requirementId),
      round,
      // Local wall-clock time, sent as-is - see note in fmtDateTime/backend.
      // Converting to UTC here would shift the displayed time later, since
      // the backend LocalDateTime field has no timezone of its own.
      scheduledAt: `${scheduledAt}:00`,
    });
  };

  return (
    <div
      className="im-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="im-modal">
        <div className="im-modal-header">
          <div>
            <div className="im-kicker">Client Interview Desk</div>
            <h2 className="im-modal-title">{title}</h2>
          </div>
          <button className="im-close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="im-form" onSubmit={submit}>
          {canPickProject ? (
            <label className="im-field">
              <span>Project</span>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
              >
                <option value="">-- Select Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || project.projectName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {canPickRequirement ? (
            <label className="im-field">
              <span>Requirement / Role</span>
              <select
                value={requirementId}
                onChange={(e) => handleRequirementChange(e.target.value)}
                required
                disabled={!projectId}
              >
                <option value="">-- Select Requirement --</option>
                {requirementOptions.map((requirement, index) => (
                  <option key={requirement.id} value={requirement.id}>
                    Requirement {index + 1}: {requirement.roleName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="im-field">
              <span>Requirement / Role</span>
              <div className="im-readonly-value">
                {selectedRequirement?.roleName || 'Same role as previous round'}
              </div>
            </div>
          )}

          {canPickEmployee ? (
            <label className="im-field">
              <span>Employee</span>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                disabled={!requirementId}
              >
                <option value="">-- Select Shortlisted Employee --</option>
                {eligibleEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employeeName(employee)} ({employee.employeeCode})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="im-field">
            <span>Interview Round</span>
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              disabled={!!defaultRound}
            >
              {ROUND_ORDER.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="im-field">
            <span>Date & Time</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </label>

          <div className="im-form-actions">
            <button type="button" className="im-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="im-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidateCard({ group, onUpdateResult, onScheduleNext, isUpdating }) {
  const sorted = [...group.interviews].sort(
    (a, b) => roundIndex(a.round) - roundIndex(b.round),
  );
  const lastPassed = [...sorted]
    .reverse()
    .find((interview) => interview.status === 'PASSED');
  const lastRound = lastPassed ? lastPassed.round : null;
  const hasFailed = sorted.some((interview) => interview.status === 'FAILED');
  const canScheduleNext =
    !hasFailed &&
    lastPassed &&
    roundIndex(lastPassed.round) < ROUND_ORDER.length - 1;
  const nextRound = canScheduleNext
    ? ROUND_ORDER[roundIndex(lastPassed.round) + 1]
    : null;
  const isAllocated = sorted.some(
    (interview) => interview.round === 'HR' && interview.status === 'PASSED',
  );

  return (
    <article className="im-timeline-card">
      <div className="im-timeline-header">
        <div>
          <div className="im-timeline-name">{group.employeeName}</div>
        </div>
        {isAllocated ? (
          <span className="im-allocated-badge">✓ ALLOCATED</span>
        ) : null}
      </div>

      <div className="im-timeline-rounds">
        {ROUND_ORDER.map((round) => {
          const interview = sorted.find((item) => item.round === round);
          const isScheduled = interview?.status === 'SCHEDULED';
          const isBeforeScheduledTime =
            isScheduled &&
            interview?.scheduledAt &&
            new Date(interview.scheduledAt) > new Date();

          return (
            <div
              key={round}
              className={`im-round-step ${interview ? 'im-round-active' : 'im-round-pending'} ${
                interview?.status === 'PASSED'
                  ? 'im-round-passed'
                  : interview?.status === 'FAILED'
                    ? 'im-round-failed'
                    : ''
              }`}
            >
              <div className="im-round-dot">
                {interview?.status === 'PASSED'
                  ? '✓'
                  : interview?.status === 'FAILED'
                    ? '✗'
                    : round}
              </div>
              <div className="im-round-body">
                <div className="im-round-label">{ROUND_LABELS[round]}</div>
                {interview ? (
                  <>
                    <div className="im-round-time">
                      {fmtDateTime(interview.scheduledAt)}
                    </div>
                    <StatusPill status={interview.status} />
                    {isScheduled && !isUpdating && !isBeforeScheduledTime ? (
                      <div className="im-round-actions">
                        <button
                          className="im-mini-pass"
                          type="button"
                          onClick={() => onUpdateResult(interview.id, 'PASSED')}
                        >
                          ✓ Pass
                        </button>
                        <button
                          className="im-mini-fail"
                          type="button"
                          onClick={() => onUpdateResult(interview.id, 'FAILED')}
                        >
                          ✗ Fail
                        </button>
                      </div>
                    ) : null}
                    {isScheduled && isBeforeScheduledTime ? (
                      <div className="im-round-pending-label">
                        Result can be recorded after{' '}
                        {fmtDateTime(interview.scheduledAt)}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="im-round-pending-label">Not scheduled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasFailed ? (
        <div className="im-next-round-bar">
          <span>Round Fail</span>
        </div>
      ) : canScheduleNext && !isAllocated ? (
        <div className="im-next-round-bar">
          <span>
            {lastRound} passed. Next round unlocked: {nextRound}
          </span>
          <button
            className="im-btn-primary im-btn-sm"
            type="button"
            onClick={() =>
              onScheduleNext(
                lastPassed.id,
                nextRound,
                group.employeeId,
                group.projectId,
                group.requirementId,
              )
            }
          >
            Schedule {nextRound} Round →
          </button>
        </div>
      ) : null}
    </article>
  );
}

// One requirement = one self-contained box: role name, "X of Y filled", a
// pending-count message when it isn't full yet, and only that requirement's
// candidates. Nothing here depends on any other requirement or project.
function RequirementSection({
  requirement,
  onUpdateResult,
  onScheduleNext,
  isUpdating,
}) {
  const isFull = requirement.total > 0 && requirement.pending === 0;

  return (
    <div className="im-requirement-block">
      <div className="im-requirement-header">
        <div className="im-requirement-title">
          <span className="im-requirement-role">{requirement.roleName}</span>
          <span className="im-requirement-fill">
            {requirement.filled} of {requirement.total} filled
          </span>
        </div>
        {isFull ? (
          <span className="im-requirement-complete">✓ Complete</span>
        ) : requirement.total > 0 ? (
          <span className="im-requirement-pending">
            {requirement.pending} more requirement
            {requirement.pending === 1 ? '' : 's'} pending
          </span>
        ) : null}
      </div>

      {requirement.candidates.length === 0 ? (
        <div className="im-requirement-empty">
          No candidates scheduled for this role yet.
        </div>
      ) : (
        <div className="im-timelines">
          {requirement.candidates.map((group) => (
            <CandidateCard
              key={`${group.employeeId}::${group.projectId}::${group.requirementId}`}
              group={group}
              onUpdateResult={onUpdateResult}
              onScheduleNext={onScheduleNext}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientInterviewManagement({ currentUser, onLogout }) {
  const token = currentUser?.token;
  const [interviews, setInterviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [nextRoundCtx, setNextRoundCtx] = useState(null);

  const shortlistedEmployees = useMemo(() => {
    const assignedIds = new Set(
      projects.flatMap((project) =>
        (project.requirements || []).flatMap((requirement) =>
          parseIds(requirement.assignedEmployeeIds),
        ),
      ),
    );
    return employees.filter(
      (employee) =>
        employee.status === 'SHORTLISTED' && assignedIds.has(employee.id),
    );
  }, [employees, projects]);

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [interviewsRes, projectsRes, employeesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/interviews`, {
          headers: authHeaders(token),
        }),
        fetch(`${API_BASE_URL}/api/projects`, { headers: authHeaders(token) }),
        fetch(`${API_BASE_URL}/api/admin/employees`, {
          headers: authHeaders(token),
        }),
      ]);

      if (!interviewsRes.ok || !projectsRes.ok || !employeesRes.ok) {
        const failed = !interviewsRes.ok
          ? 'interviews'
          : !projectsRes.ok
            ? 'projects'
            : 'employees';
        throw new Error(`Failed to load ${failed}.`);
      }

      const [interviewsData, projectsData, employeesData] = await Promise.all([
        interviewsRes.json(),
        projectsRes.json(),
        employeesRes.json(),
      ]);

      setInterviews(interviewsData);
      setProjects(projectsData);
      setEmployees(employeesData);
    } catch (err) {
      setError(err.message || 'Unable to load interview data.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cancelled) {
        await loadData();
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const grouped = useMemo(() => groupInterviews(interviews), [interviews]);
  const board = useMemo(
    () => buildRequirementBoard(projects, grouped),
    [projects, grouped],
  );

  const metrics = useMemo(
    () => ({
      total: grouped.length,
      scheduled: interviews.filter(
        (interview) => interview.status === 'SCHEDULED',
      ).length,
      passed: interviews.filter((interview) => interview.status === 'PASSED')
        .length,
      allocated: grouped.filter((group) =>
        group.interviews.some(
          (interview) =>
            interview.round === 'HR' && interview.status === 'PASSED',
        ),
      ).length,
    }),
    [grouped, interviews],
  );

  const saveSchedule = async (payload) => {
    setIsSaving(true);
    setError('');
    try {
      const url = nextRoundCtx
        ? `${API_BASE_URL}/api/interviews/${nextRoundCtx.interviewId}/next-round`
        : `${API_BASE_URL}/api/interviews`;
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(body.message || 'Failed to schedule interview.');
      }

      setShowSchedule(false);
      setNextRoundCtx(null);
      await loadData();
      showSuccess('Interview scheduled successfully.');
    } catch (err) {
      setError(err.message || 'Failed to schedule interview.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateResult = async (interviewId, status) => {
    setIsUpdating(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/interviews/${interviewId}/result`,
        {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(body.message || 'Failed to update interview result.');
      }

      await loadData();
      showSuccess(
        status === 'PASSED'
          ? 'Interview marked as Passed.'
          : 'Interview marked as Failed.',
      );
    } catch (err) {
      setError(err.message || 'Failed to update interview result.');
    } finally {
      setIsUpdating(false);
    }
  };

  const scheduleNext = (
    interviewId,
    round,
    employeeId,
    projectId,
    requirementId,
  ) => {
    setNextRoundCtx({
      interviewId,
      round,
      employeeId,
      projectId,
      requirementId,
    });
    setShowSchedule(true);
  };

  return (
    <main className="im-page">
      <style>{`
.im-page {
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

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

.im-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.im-nav-user {
  font-size: 13px;
  color: #8b98a5;
  margin-right: 4px;
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

.im-btn-primary {
  background: #00d4ff;
  color: #04141b;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}

.im-btn-primary:hover {
  filter: brightness(1.08);
}

.im-btn-primary:active {
  transform: translateY(1px);
}

.im-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.im-btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.im-btn-ghost {
  background: transparent;
  border: 1px solid #2a3844;
  color: #c3cdd6;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.im-btn-ghost:hover {
  border-color: #3d4c59;
  color: #fff;
}

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
  margin: 0 0 28px;
  color: #8b98a5;
  font-size: 14px;
}

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

.im-alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
}

.im-alert-error {
  background: rgba(255, 95, 87, 0.1);
  border: 1px solid rgba(255, 95, 87, 0.35);
  color: #ff8f89;
}

.im-alert-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #6ee7a0;
}

.im-loading {
  color: #8b98a5;
  padding: 40px 0;
  text-align: center;
}

.im-empty {
  text-align: center;
  padding: 64px 24px;
  border: 1px dashed #2a3844;
  border-radius: 12px;
  color: #8b98a5;
}

.im-empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.im-empty h3 {
  color: #f4f8fb;
  margin: 0 0 6px;
}

.im-empty p {
  margin: 0;
  font-size: 14px;
}

/* ---------- Project / Requirement board ---------- */

.im-project-block {
  margin-bottom: 36px;
}

.im-project-title {
  font-size: 18px;
  font-weight: 700;
  color: #f4f8fb;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #1e2a35;
}

.im-requirement-block {
  background: #0e141b;
  border: 1px solid #1e2a35;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
}

.im-requirement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.im-requirement-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.im-requirement-role {
  font-size: 15px;
  font-weight: 700;
  color: #f4f8fb;
}

.im-requirement-fill {
  font-size: 12px;
  color: #8b98a5;
}

.im-requirement-complete {
  font-size: 12px;
  font-weight: 700;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
}

.im-requirement-pending {
  font-size: 12px;
  font-weight: 700;
  color: #eab308;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
}

.im-requirement-empty {
  font-size: 13px;
  color: #6b7885;
  padding: 8px 0;
}

.im-timelines {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
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
}

.im-round-time {
  font-size: 12px;
  color: #6b7885;
  margin: 2px 0 6px;
}

.im-round-pending-label {
  font-size: 12px;
  color: #4c5762;
  margin-top: 2px;
}

.im-round-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.im-mini-pass,
.im-mini-fail {
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.im-mini-pass {
  background: rgba(34, 197, 94, 0.14);
  color: #22c55e;
}

.im-mini-pass:hover {
  background: rgba(34, 197, 94, 0.26);
}

.im-mini-fail {
  background: rgba(255, 95, 87, 0.12);
  color: #ff5f57;
}

.im-mini-fail:hover {
  background: rgba(255, 95, 87, 0.24);
}

.im-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.im-next-round-bar {
  border-top: 1px solid #1e2a35;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #8b98a5;
}

.im-next-round-bar:has(> span:only-child) {
  color: #ff8f89;
  font-weight: 600;
  justify-content: flex-start;
}

.im-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 12, 0.72);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.im-modal {
  background: #11181f;
  border: 1px solid #24313d;
  border-radius: 14px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.im-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.im-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #00d4ff;
  margin-bottom: 4px;
}

.im-modal-title {
  font-size: 18px;
  margin: 0;
  color: #f4f8fb;
}

.im-close-btn {
  background: transparent;
  border: none;
  color: #6b7885;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.im-close-btn:hover {
  color: #fff;
}

.im-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.im-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #c3cdd6;
}

.im-field select,
.im-field input {
  background: #0b0f14;
  border: 1px solid #2a3844;
  border-radius: 8px;
  padding: 10px 12px;
  color: #e6edf3;
  font-size: 14px;
}

.im-field select:focus,
.im-field input:focus {
  outline: none;
  border-color: #00d4ff;
}

.im-field select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.im-readonly-value {
  background: #0b0f14;
  border: 1px solid #2a3844;
  border-radius: 8px;
  padding: 10px 12px;
  color: #8b98a5;
  font-size: 14px;
}

.im-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

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
        <div className="im-nav-title">Client Interview Desk</div>
        <div className="im-nav-actions">
          <span className="im-nav-user">{currentUser?.email}</span>
          <button
            className="im-btn-primary im-btn-sm"
            type="button"
            onClick={() => {
              setNextRoundCtx(null);
              setShowSchedule(true);
            }}
          >
            + Schedule Interview
          </button>
          <button className="im-logout" type="button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </nav>

      <section className="im-content">
        <div className="im-heading">
          <div>
            <h1>Interview Management</h1>
            <p>
              Organized by project and role. Each role shows how many spots are
              filled, independent of every other role.
            </p>
          </div>
        </div>

        <div className="im-metrics">
          <div className="im-metric-card im-metric-cyan">
            <div className="im-metric-value">{metrics.total}</div>
            <div className="im-metric-label">Interview Tracks</div>
            <div className="im-metric-sub">Candidate + role pairs</div>
          </div>
          <div className="im-metric-card im-metric-blue">
            <div className="im-metric-value">{metrics.scheduled}</div>
            <div className="im-metric-label">Scheduled</div>
            <div className="im-metric-sub">Awaiting result</div>
          </div>
          <div className="im-metric-card im-metric-green">
            <div className="im-metric-value">{metrics.passed}</div>
            <div className="im-metric-label">Passed</div>
            <div className="im-metric-sub">Rounds cleared</div>
          </div>
          <div className="im-metric-card im-metric-gold">
            <div className="im-metric-value">{metrics.allocated}</div>
            <div className="im-metric-label">Allocated</div>
            <div className="im-metric-sub">HR cleared</div>
          </div>
        </div>

        {error ? <div className="im-alert im-alert-error">{error}</div> : null}
        {successMsg ? (
          <div className="im-alert im-alert-success">{successMsg}</div>
        ) : null}

        {isLoading ? (
          <div className="im-loading">Loading interviews…</div>
        ) : board.length === 0 ? (
          <div className="im-empty">
            <div className="im-empty-icon">📋</div>
            <h3>No project requirements found</h3>
            <p>
              {shortlistedEmployees.length > 0
                ? 'Use Schedule Interview to create the first L1 interview.'
                : 'No shortlisted employees are ready for scheduling yet.'}
            </p>
          </div>
        ) : (
          board.map((project) => (
            <div className="im-project-block" key={project.projectId}>
              <div className="im-project-title">📋 {project.projectName}</div>
              {project.requirements.map((requirement) => (
                <RequirementSection
                  key={requirement.requirementId}
                  requirement={requirement}
                  onUpdateResult={updateResult}
                  onScheduleNext={scheduleNext}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          ))
        )}
      </section>

      {showSchedule ? (
        <ScheduleModal
          title={
            nextRoundCtx
              ? `Schedule ${nextRoundCtx.round} Round`
              : 'Schedule Interview'
          }
          shortlistedEmployees={shortlistedEmployees}
          projects={projects}
          defaultEmployeeId={nextRoundCtx?.employeeId}
          defaultProjectId={nextRoundCtx?.projectId}
          defaultRequirementId={nextRoundCtx?.requirementId}
          defaultRound={nextRoundCtx?.round}
          onClose={() => {
            setShowSchedule(false);
            setNextRoundCtx(null);
          }}
          onSave={saveSchedule}
          isSaving={isSaving}
        />
      ) : null}
    </main>
  );
}
