import { useState, useEffect, useCallback } from 'react';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectDuration,
  deleteProject,
  getMatchingEmployees,
  shortlistEmployees,
} from '../api/projectApi';

const BADGE_COLORS = [
  { bg: 'rgba(0,212,255,0.12)', text: '#00d4ff' },
  { bg: 'rgba(240,165,0,0.12)', text: '#f0a500' },
  { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' },
  { bg: 'rgba(13,110,253,0.15)', text: '#3d8bfd' },
  { bg: 'rgba(251,146,60,0.12)', text: '#fb923c' },
];
function skillColor(skill) {
  let h = 0;
  for (let i = 0; i < skill.length; i++)
    h = (h * 31 + skill.charCodeAt(i)) >>> 0;
  return BADGE_COLORS[h % BADGE_COLORS.length];
}

const SkillBadge = ({ skill }) => {
  const display = skill.includes(':') ? skill.replace(':', ' (') + ')' : skill;
  const { bg, text } = skillColor(display.trim());
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
        margin: '2px 3px',
      }}
    >
      {display.trim()}
    </span>
  );
};

function employeeName(employee) {
  return (
    [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') ||
    employee?.email ||
    'Employee'
  );
}

function employeeSkills(employee) {
  if (Array.isArray(employee?.skills)) {
    return employee.skills
      .map((skill) => {
        if (skill.proficiency) {
          return `${skill.skillName}:${skill.proficiency}`;
        }
        return skill.skillName;
      })
      .filter(Boolean);
  }

  if (typeof employee?.skills === 'string') {
    return employee.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

const StatusPill = ({ status }) => {
  const colors = {
    OPEN: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
    IN_PROGRESS: { bg: 'rgba(240,165,0,0.12)', text: '#f0a500' },
    CLOSED: { bg: 'rgba(255,255,255,0.06)', text: '#7a8fa8' },
  };
  const { bg, text } = colors[status] || colors.OPEN;
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '3px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {status}
    </span>
  );
};

const ALL_SKILLS = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Angular',
  'Vue',
  'Node.js',
  'Spring Boot',
  'Express',
  'Django',
  'Flask',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Oracle',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Git',
  'HTML',
  'CSS',
  'C++',
  'C#',
  'Ruby',
  'PHP',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Scala',
];

function parseRequiredSkills(str) {
  if (!str) return [];
  return str
    .split(',')
    .map((s) => {
      s = s.trim();
      if (s.includes(':')) {
        const idx = s.indexOf(':');
        return {
          name: s.substring(0, idx).trim(),
          level: s.substring(idx + 1).trim(),
        };
      }
      return { name: s, level: 'Entry Level' };
    })
    .filter((s) => s.name);
}

function serializeRequiredSkills(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .filter((s) => s && s.name && s.name.trim())
    .map((s) => `${s.name.trim()}:${(s.level || 'Entry Level').trim()}`)
    .join(',');
}

const emptyReq = () => ({
  roleName: '',
  requiredSkills: [],
  minExperienceYears: 0,
  numberOfPeople: 1,
});

function ProjectForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail || '');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [requirements, setRequirements] = useState(
    initial?.requirements?.length
      ? initial.requirements.map((r) => ({
          roleName: r.roleName,
          requiredSkills: parseRequiredSkills(r.requiredSkills),
          minExperienceYears: r.minExperienceYears,
          numberOfPeople: r.numberOfPeople,
        }))
      : [emptyReq()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateReq = (i, field, val) =>
    setRequirements((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    );

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Project name is required.');
    if (!startDate) return setError('Project start date is required.');
    if (!endDate) return setError('Project end date is required.');
    if (new Date(endDate) < new Date(startDate))
      return setError('End date cannot be earlier than start date.');
    if (
      requirements.some(
        (r) =>
          !r.roleName.trim() ||
          !r.requiredSkills.length ||
          r.requiredSkills.some((s) => !s.name.trim()),
      )
    )
      return setError(
        'Each requirement needs a role name and at least one skill.',
      );
    setSaving(true);
    setError('');
    try {
      const serializedRequirements = requirements.map((r) => ({
        ...r,
        requiredSkills: serializeRequiredSkills(r.requiredSkills),
      }));
      await onSave({
        name,
        description,
        clientEmail,
        startDate,
        endDate,
        requirements: serializedRequirements,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.formCard}>
      <h2 style={S.formTitle}>{initial ? 'Edit Project' : 'New Project'}</h2>
      {error && <div style={S.errorBanner}>{error}</div>}

      <label style={S.label}>Project Name *</label>
      <input
        style={S.input}
        placeholder="e.g. E-Commerce Platform Rebuild"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label style={S.label}>Description</label>
      <textarea
        style={{ ...S.input, height: 80, resize: 'vertical' }}
        placeholder="Brief overview..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label style={S.label}>Client Email *</label>
      <input
        style={S.input}
        type="email"
        placeholder="client@example.com"
        value={clientEmail}
        onChange={(e) => setClientEmail(e.target.value)}
        required
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={S.label}>Start Date *</label>
          <input
            style={S.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={S.label}>End Date *</label>
          <input
            style={S.input}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          marginBottom: 8,
        }}
      >
        <h3
          style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e8edf5' }}
        >
          Requirements ({requirements.length})
        </h3>
        <button
          style={S.addReqBtn}
          onClick={() => setRequirements((p) => [...p, emptyReq()])}
        >
          + Add Requirement
        </button>
      </div>

      {requirements.map((req, i) => (
        <div key={i} style={S.reqBlock}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 600, color: '#7a8fa8', fontSize: 13 }}>
              Requirement #{i + 1}
            </span>
            {requirements.length > 1 && (
              <button
                style={S.removeBtn}
                onClick={() =>
                  setRequirements((p) => p.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </button>
            )}
          </div>
          <div style={S.reqGrid}>
            <div>
              <label style={S.label}>Role / Position *</label>
              <input
                style={S.input}
                placeholder="e.g. Backend Developer"
                value={req.roleName}
                onChange={(e) => updateReq(i, 'roleName', e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Required Skills *</label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {(req.requiredSkills || []).map((skill, sIdx) => (
                  <div
                    key={sIdx}
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <select
                      style={{
                        ...S.input,
                        ...S.skillSelect,
                        flex: 2,
                        margin: 0,
                        minWidth: 0,
                      }}
                      value={skill.name}
                      onChange={(e) => {
                        const nextSkills = [...req.requiredSkills];
                        nextSkills[sIdx] = { ...skill, name: e.target.value };
                        updateReq(i, 'requiredSkills', nextSkills);
                      }}
                    >
                      <option value="" style={S.skillOption}>
                        -- Select Skill --
                      </option>
                      {ALL_SKILLS.map((s) => (
                        <option key={s} value={s} style={S.skillOption}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      style={{
                        ...S.input,
                        ...S.skillSelect,
                        flex: 1.5,
                        margin: 0,
                        minWidth: 0,
                      }}
                      value={skill.level}
                      onChange={(e) => {
                        const nextSkills = [...req.requiredSkills];
                        nextSkills[sIdx] = { ...skill, level: e.target.value };
                        updateReq(i, 'requiredSkills', nextSkills);
                      }}
                    >
                      <option value="Entry Level" style={S.skillOption}>
                        Entry Level
                      </option>
                      <option value="Intermediate" style={S.skillOption}>
                        Intermediate
                      </option>
                      <option value="Advanced" style={S.skillOption}>
                        Advanced
                      </option>
                    </select>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffb4ae',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      onClick={() => {
                        const nextSkills = req.requiredSkills.filter(
                          (_, idx) => idx !== sIdx,
                        );
                        updateReq(i, 'requiredSkills', nextSkills);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(0, 212, 255, 0.08)',
                    color: '#00d4ff',
                    border: '1px dashed rgba(0, 212, 255, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                  onClick={() => {
                    const nextSkills = [
                      ...(req.requiredSkills || []),
                      { name: '', level: 'Entry Level' },
                    ];
                    updateReq(i, 'requiredSkills', nextSkills);
                  }}
                >
                  + Add Skill
                </button>
              </div>
            </div>
            <div>
              <label style={S.label}>Min. Experience (years)</label>
              <input
                style={S.input}
                type="number"
                min={0}
                value={req.minExperienceYears}
                onChange={(e) =>
                  updateReq(
                    i,
                    'minExperienceYears',
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
            <div>
              <label style={S.label}>Number of People</label>
              <input
                style={S.input}
                type="number"
                min={1}
                value={req.numberOfPeople}
                onChange={(e) =>
                  updateReq(i, 'numberOfPeople', parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button style={S.primaryBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update Project' : 'Create Project'}
        </button>
        <button style={S.ghostBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function MatchPanel({ projectId, requirement, onShortlisted }) {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Backend now computes this authoritatively - counts assignedEmployeeIds
  // whose CURRENT status is SHORTLISTED or ALLOCATED, so it automatically
  // reflects fails/reverts with no frontend guesswork needed.
  const total = requirement.numberOfPeople || 0;
  const filled = requirement.activeShortlistedCount ?? 0;
  const pending = Math.max(total - filled, 0);
  const isFull = total > 0 && pending === 0;

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMatchingEmployees(projectId, requirement.id);
      setMatches(data);
      if (requirement.assignedEmployeeIds) {
        // Only pre-check candidates who are STILL actively shortlisted or
        // allocated right now. assignedEmployeeIds never shrinks on its
        // own - if someone failed an interview, their status reverted to
        // ON_BENCH but their ID is still sitting in that string. Without
        // this filter, they'd get silently re-submitted on the next save
        // (bundled in with whoever you actually meant to add), and the
        // backend correctly rejects that one ID - but since it's one
        // request, that rejection blocks the ENTIRE save, including the
        // new candidate you were actually trying to add.
        const statusById = new Map(data.map((emp) => [emp.id, emp.status]));
        const stillActive = requirement.assignedEmployeeIds
          .split(',')
          .map(Number)
          .filter((id) => {
            const status = statusById.get(id);
            return status === 'SHORTLISTED' || status === 'ALLOCATED';
          });
        setSelected(new Set(stillActive));
      }
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, requirement.id, requirement.assignedEmployeeIds]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await shortlistEmployees(projectId, requirement.id, [...selected]);
      setDone(true);
      onShortlisted();
    } catch {
      setDone(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.matchPanel}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#e8edf5', fontSize: 14 }}>
            {requirement.roleName}
          </div>
          <div style={{ fontSize: 12, color: '#7a8fa8', marginTop: 2 }}>
            {requirement.numberOfPeople} needed ·{' '}
            {requirement.minExperienceYears}+ yrs
          </div>
        </div>
        {matches !== null && !loading && (
          <button style={S.matchBtn} onClick={loadMatches}>
            Refresh
          </button>
        )}
        {matches === null && !loading && (
          <button style={S.matchBtn} onClick={loadMatches}>
            Find Matches
          </button>
        )}
      </div>

      {/* Fill status - always visible immediately, no need to click Find
          Matches first, and always accurate since it's derived straight
          from allocatedCount rather than a separately-tracked count. */}
      <div style={{ marginTop: 10 }}>
        {isFull ? (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ All {total} position(s) filled for {requirement.roleName}
          </div>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(240, 165, 0, 0.1)',
              border: '1px solid rgba(240, 165, 0, 0.2)',
              color: '#f0a500',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠ {pending} more position(s) needed for {requirement.roleName} (
            {filled}/{total} filled)
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap' }}>
        {requirement.requiredSkills.split(',').map((s) => (
          <SkillBadge key={s} skill={s} />
        ))}
      </div>

      {loading && <div style={S.muted}>Searching…</div>}

      {matches !== null && !loading && (
        <>
          {matches.length === 0 ? (
            <div style={S.emptyMatch}>
              No employees match the required skills.
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: '#7a8fa8',
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                {matches.length} matching employee
                {matches.length !== 1 ? 's' : ''} - select to shortlist
              </div>
              <div style={S.matchGrid}>
                {matches.map((emp) => {
                  const isSelected = selected.has(emp.id);
                  const name = employeeName(emp);
                  return (
                    <div
                      key={emp.id}
                      style={{
                        ...S.empCard,
                        ...(isSelected ? S.empCardSelected : {}),
                      }}
                      onClick={() => toggle(emp.id)}
                    >
                      <div style={S.avatar}>{name.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: '#e8edf5',
                          }}
                        >
                          {name}
                        </div>
                        <div style={{ fontSize: 11, color: '#7a8fa8' }}>
                          {emp.experienceYears || 0} yrs experience -{' '}
                          {emp.status}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {employeeSkills(emp)
                            .slice(0, 3)
                            .map((s) => (
                              <SkillBadge key={s} skill={s} />
                            ))}
                        </div>
                      </div>
                      {isSelected && <span style={S.checkmark}>✓</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  style={S.primaryBtn}
                  onClick={save}
                  disabled={saving || selected.size === 0}
                >
                  {saving
                    ? 'Saving…'
                    : `Shortlist ${selected.size} employee${selected.size !== 1 ? 's' : ''}`}
                </button>
                {done && (
                  <span
                    style={{
                      alignSelf: 'center',
                      color: '#22c55e',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Saved
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span style={S.muted}>
                  Shortlisting is saved here. The client dashboard schedules L1,
                  L2, and HR interviews after this step.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ProjectDashboard({ project, onBack, onEdit, onDeleted, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [newStartDate, setNewStartDate] = useState(project.startDate || '');
  const [newEndDate, setNewEndDate] = useState(project.endDate || '');
  const [savingDuration, setSavingDuration] = useState(false);
  const [durationError, setDurationError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveDuration = async () => {
    if (!newStartDate || !newEndDate) {
      setDurationError('Both start date and end date are required.');
      return;
    }
    if (new Date(newEndDate) < new Date(newStartDate)) {
      setDurationError('End date cannot be earlier than start date.');
      return;
    }
    setSavingDuration(true);
    setDurationError('');
    try {
      await updateProjectDuration(project.id, newStartDate, newEndDate);
      setEditingDuration(false);
      onRefresh();
    } catch (e) {
      setDurationError(e.message);
    } finally {
      setSavingDuration(false);
    }
  };

  const totalRequired = project.requirements.reduce(
    (sum, req) => sum + (req.numberOfPeople || 0),
    0,
  );
  const totalAssigned = project.requirements.reduce(
    (sum, req) => sum + (req.activeShortlistedCount ?? 0),
    0,
  );
  const totalPending = totalRequired - totalAssigned;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <button style={S.backBtn} onClick={onBack}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: '#e8edf5',
              }}
            >
              {project.name}
            </h2>
            <StatusPill status={project.status} />
          </div>
          {project.description && (
            <p style={{ margin: '4px 0 0', color: '#7a8fa8', fontSize: 14 }}>
              {project.description}
            </p>
          )}
          <div style={{ fontSize: 12, color: '#4a5e78', marginTop: 4 }}>
            Created by {project.createdBy} ·{' '}
            {new Date(project.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
        <button style={S.editBtn} onClick={onEdit}>
          Edit
        </button>
        {!confirmDelete ? (
          <button style={S.dangerBtn} onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#ffb4ae' }}>Sure?</span>
            <button
              style={S.dangerBtn}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '…' : 'Yes, delete'}
            </button>
            <button style={S.ghostBtn} onClick={() => setConfirmDelete(false)}>
              No
            </button>
          </div>
        )}
      </div>

      {/* Project Duration Card / Extend & Reduce Duration section */}
      <div
        style={{
          background: '#0a1628',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8edf5' }}>
              Project Timeline / Duration
            </div>
            <div style={{ fontSize: 13, color: '#7a8fa8', marginTop: 2 }}>
              {project.startDate && project.endDate ? (
                <>
                  <span style={{ color: '#00d4ff', fontWeight: 600 }}>
                    📅 {project.startDate}
                  </span>{' '}
                  to{' '}
                  <span style={{ color: '#00d4ff', fontWeight: 600 }}>
                    🏁 {project.endDate}
                  </span>
                  {new Date(project.endDate) < new Date(new Date().toISOString().split('T')[0]) && (
                    <span
                      style={{
                        marginLeft: 10,
                        background: 'rgba(255, 95, 87, 0.15)',
                        color: '#ffb4ae',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      EXPIRED (Employees set to ON_BENCH)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: '#f0a500' }}>
                  Dates not specified
                </span>
              )}
            </div>
          </div>
          <button
            style={S.matchBtn}
            onClick={() => {
              setNewStartDate(project.startDate || '');
              setNewEndDate(project.endDate || '');
              setEditingDuration(!editingDuration);
            }}
          >
            {editingDuration ? 'Cancel Duration Edit' : 'Extend / Reduce Duration'}
          </button>
        </div>

        {editingDuration && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {durationError && <div style={S.errorBanner}>{durationError}</div>}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={S.label}>Start Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>End Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
            <button
              style={S.primaryBtn}
              onClick={handleSaveDuration}
              disabled={savingDuration}
            >
              {savingDuration ? 'Saving…' : 'Save Duration'}
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <h3
          style={{
            margin: '0',
            fontSize: 16,
            fontWeight: 700,
            color: '#e8edf5',
          }}
        >
          Requirements & Employee Matching
        </h3>
        {project.requirements.length > 0 && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 100,
              background:
                totalPending > 0
                  ? 'rgba(240, 165, 0, 0.1)'
                  : 'rgba(34, 197, 94, 0.1)',
              color: totalPending > 0 ? '#f0a500' : '#22c55e',
              border: `1px solid ${totalPending > 0 ? 'rgba(240, 165, 0, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
            }}
          >
            {totalPending > 0
              ? `⚠ ${totalPending} position(s) pending across project`
              : `✓ All project positions filled (${totalRequired}/${totalRequired})`}
          </div>
        )}
      </div>

      {project.requirements.length === 0 ? (
        <div style={S.emptyState}>No requirements added to this project.</div>
      ) : (
        project.requirements.map((req) => (
          <MatchPanel
            key={req.id}
            projectId={project.id}
            requirement={req}
            onShortlisted={onRefresh}
          />
        ))
      )}
    </div>
  );
}

function ProjectList({ projects, onSelect, onCreate }) {
  return (
    <div>
      <div style={S.listHeader}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: '#e8edf5',
            }}
          >
            Demand Management
          </h2>
          <p style={{ margin: '4px 0 0', color: '#7a8fa8', fontSize: 14 }}>
            Create projects, define hiring requirements, match employees.
          </p>
        </div>
        <button style={S.primaryBtn} onClick={onCreate}>
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={S.emptyState}>
          No projects yet. Create your first project to start hiring.
        </div>
      ) : (
        <div style={S.cardGrid}>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              style={S.projectCard}
              onClick={() => onSelect(p)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#e8edf5',
                    lineHeight: 1.3,
                  }}
                >
                  {p.name}
                </span>
                <StatusPill status={p.status} />
              </div>
              {p.description && (
                <p
                  style={{
                    margin: '0 0 10px',
                    color: '#7a8fa8',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {p.description}
                </p>
              )}
              {p.startDate && p.endDate && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#00d4ff',
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  📅 {p.startDate} → {p.endDate}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                }}
              >
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={S.stat}>
                    <span style={S.statNum}>{p.requirements.length}</span>
                    <span style={S.statLabel}>Roles</span>
                  </div>
                  <div style={S.stat}>
                    <span style={S.statNum}>
                      {p.requirements.reduce(
                        (sum, r) => sum + r.numberOfPeople,
                        0,
                      )}
                    </span>
                    <span style={S.statLabel}>People needed</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#4a5e78' }}>
                  {new Date(p.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemandManagement({ currentUser, onBack, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshSelected = async () => {
    const fresh = await getAllProjects();
    setProjects(fresh);
    if (selected) {
      const project = await getProjectById(selected.id);
      setSelected(project);
    }
  };

  const handleCreate = async (data) => {
    const project = await createProject(data);
    await load();
    setSelected(project);
    setView('dashboard');
  };
  const handleUpdate = async (data) => {
    await updateProject(selected.id, data);
    const project = await getProjectById(selected.id);
    await load();
    setSelected(project);
    setView('dashboard');
  };
  const handleDeleted = async () => {
    await load();
    setSelected(null);
    setView('list');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#050d1a',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: '#00d4ff',
          }}
        />
        <span style={{ color: '#7a8fa8', fontSize: 14, marginTop: 12 }}>
          Loading projects…
        </span>
      </div>
    );
  }

  return (
    <div
      className="demand-mgmt"
      style={{
        minHeight: '100vh',
        background: '#050d1a',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Top nav bar */}
      <div
        style={{
          background: '#0F172A',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#00d4ff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Home
          </button>
          <span style={{ color: '#4a5e78', fontSize: 14 }}>|</span>
          <span style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>
            Demand Management
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#7a8fa8', fontSize: 13 }}>
            {currentUser?.email}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: 'none',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
        {view === 'list' && (
          <ProjectList
            projects={projects}
            onSelect={async (p) => {
              const project = await getProjectById(p.id);
              setSelected(project);
              setView('dashboard');
            }}
            onCreate={() => setView('create')}
          />
        )}
        {view === 'create' && (
          <ProjectForm onSave={handleCreate} onCancel={() => setView('list')} />
        )}
        {view === 'edit' && selected && (
          <ProjectForm
            initial={selected}
            onSave={handleUpdate}
            onCancel={() => setView('dashboard')}
          />
        )}
        {view === 'dashboard' && selected && (
          <ProjectDashboard
            project={selected}
            onBack={() => {
              setSelected(null);
              setView('list');
            }}
            onEdit={() => setView('edit')}
            onDeleted={handleDeleted}
            onRefresh={refreshSelected}
          />
        )}
      </div>
    </div>
  );
}

const S = {
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: 16,
  },
  projectCard: {
    background: '#0a1628',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '20px 20px 16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 140,
    boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
    textAlign: 'left',
    font: 'inherit',
  },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 800, color: '#00d4ff', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#4a5e78', marginTop: 2 },
  emptyState: {
    textAlign: 'center',
    color: '#4a5e78',
    fontSize: 15,
    padding: '48px 24px',
    background: '#0a1628',
    borderRadius: 14,
    border: '1px dashed rgba(255,255,255,0.08)',
  },
  formCard: {
    background: '#0a1628',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 28,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  formTitle: {
    margin: '0 0 20px',
    fontSize: 20,
    fontWeight: 800,
    color: '#e8edf5',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#7a8fa8',
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    fontSize: 14,
    color: '#e8edf5',
    background: 'rgba(255,255,255,0.04)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  skillSelect: {
    background: '#0f2040',
    color: '#e8edf5',
    WebkitTextFillColor: '#e8edf5',
  },
  skillOption: {
    background: '#0f2040',
    color: '#e8edf5',
  },
  reqBlock: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 10,
  },
  reqGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  addReqBtn: {
    background: 'rgba(0,212,255,0.08)',
    color: '#00d4ff',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ffb4ae',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  errorBanner: {
    background: 'rgba(255,95,87,0.08)',
    border: '1px solid rgba(255,95,87,0.35)',
    color: '#ffb4ae',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 12,
  },
  primaryBtn: {
    background: '#00d4ff',
    color: '#001018',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  ghostBtn: {
    background: 'none',
    color: '#7a8fa8',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  editBtn: {
    background: 'rgba(255,255,255,0.04)',
    color: '#e8edf5',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerBtn: {
    background: 'rgba(255,95,87,0.08)',
    color: '#ffb4ae',
    border: '1px solid rgba(255,95,87,0.35)',
    borderRadius: 8,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 0',
    whiteSpace: 'nowrap',
  },
  matchPanel: {
    background: '#0a1628',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '16px 18px',
    marginBottom: 12,
  },
  matchBtn: {
    background: 'rgba(0,212,255,0.08)',
    color: '#00d4ff',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 10,
    marginTop: 4,
  },
  empCard: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(255,255,255,0.02)',
    position: 'relative',
  },
  empCardSelected: {
    borderColor: '#00d4ff',
    background: 'rgba(0,212,255,0.08)',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(0,212,255,0.12)',
    color: '#00d4ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15,
    flexShrink: 0,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    color: '#00d4ff',
    fontWeight: 800,
    fontSize: 14,
  },
  emptyMatch: { color: '#4a5e78', fontSize: 13, padding: '10px 0 4px' },
  muted: { color: '#4a5e78', fontSize: 13, marginTop: 8 },
};
