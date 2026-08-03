import { useEffect, useMemo, useState } from 'react';
import './SRHHomepage.css';
import logo from '../assets/Logo.png';
import { API_BASE_URL } from '../config.js';

const ROLE_OPTIONS = ['EMPLOYEE', 'CLIENT', 'PROJECT_ADMINISTRATOR', 'ADMIN'];
const EMPLOYEE_STATUS_OPTIONS = ['ON_BENCH', 'SHORTLISTED', 'ALLOCATED'];
const ALL_SKILLS = ["Java", "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Spring Boot", "Express", "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB", "Oracle", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "HTML", "CSS", "C++", "C#", "Ruby", "PHP", "Go", "Rust", "Swift", "Kotlin", "Scala"];

const ROLE_META = {
  EMPLOYEE: {
    label: 'Employee',
    tagline: 'Individual contributor',
    description: 'Full profile with skills, allocation status and bench tracking.',
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
        </svg>
    ),
  },
  CLIENT: {
    label: 'Client',
    tagline: 'Interview scheduling',
    description: 'Schedules interviews and records outcomes for shortlisted candidates.',
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h16" />
          <circle cx="18" cy="12" r="2" />
        </svg>
    ),
  },
  PROJECT_ADMINISTRATOR: {
    label: 'Project Administrator',
    tagline: 'Demand & staffing',
    description: 'Owns project demand and resource requirements.',
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M9 5V3.5h6V5" />
          <path d="M8 11h8M8 15h5" />
        </svg>
    ),
  },
  ADMIN: {
    label: 'Admin',
    tagline: 'Full control',
    description: 'Complete administrative access including bulk employee import.',
    icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
    ),
  },
};

const DEFAULT_EMPLOYEE_FORM = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  phoneNumber: '',
  department: '',
  designation: '',
  joiningDate: '',
  location: '',
  managerId: '',
  experienceYears: '',
  benchStartDate: '',
  status: 'ON_BENCH',
  active: true,
  firstLogin: true,
  // skills is now an array of objects: {skillName, proficiency, selfRating, skillDate}
  skills: [],
  certificationsText: '',
  projectHistoryText: '',
};

const DEFAULT_PROJECT_FORM = {
  projectName: '',
  description: '',
  requiredSkillsText: '',
  requiredExperience: '',
  numberOfResourcesRequired: 1,
  department: '',
  location: '',
  status: 'OPEN',
};

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function bearerHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function fullName(employee) {
  return [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || '-';
}

function listToText(items, key) {
  return (items || []).map((item) => item?.[key]).filter(Boolean).join(', ');
}

function projectSkillsToText(skills) {
  return (skills || []).filter(Boolean).join(', ');
}

function matchedSkillsText(employee, requiredSkills) {
  const required = new Set((requiredSkills || []).map((skill) => skill.toLowerCase()));
  return (employee?.skills || [])
      .map((skill) => skill.skillName)
      .filter((skillName) => required.has(skillName.toLowerCase()))
      .join(', ') || '-';
}

function splitText(value) {
  return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
}

function textToSkills(value) {
  return splitText(value).map((skillName) => ({ skillName, proficiency: 'Entry Level', selfRating: null, skillDate: '' }));
}

function textToCertifications(value) {
  return splitText(value).map((certificationName) => ({ certificationName }));
}

function textToProjectHistory(value) {
  return splitText(value).map((projectName) => ({ projectName }));
}

function nullable(value) {
  return value === '' || value === null || value === undefined ? null : value;
}

function employeeToForm(employee) {
  return {
    ...DEFAULT_EMPLOYEE_FORM,
    employeeCode: employee?.employeeCode || '',
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    password: '',
    role: employee?.role === 'PROJECT_ADMIN' ? 'PROJECT_ADMINISTRATOR' : employee?.role || 'EMPLOYEE',
    phoneNumber: employee?.phoneNumber || '',
    department: employee?.department || '',
    designation: employee?.designation || '',
    joiningDate: employee?.joiningDate || '',
    location: employee?.location || '',
    managerId: employee?.managerId || '',
    experienceYears: employee?.experienceYears || '',
    benchStartDate: employee?.benchStartDate || '',
    status: employee?.status || 'ON_BENCH',
    active: employee?.active ?? true,
    firstLogin: employee?.firstLogin ?? true,
    skills: (employee?.skills || []).map(s => ({
      skillName: s.skillName || '',
      proficiency: s.proficiency || 'Entry Level',
      selfRating: s.selfRating != null ? String(s.selfRating) : '',
      skillDate: s.skillDate || '',
    })),
    certificationsText: listToText(employee?.certifications, 'certificationName'),
    projectHistoryText: listToText(employee?.projectHistory, 'projectName'),
  };
}

function projectToForm(project) {
  return {
    ...DEFAULT_PROJECT_FORM,
    projectName: project?.projectName || '',
    description: project?.description || '',
    requiredSkillsText: projectSkillsToText(project?.requiredSkills),
    requiredExperience: project?.requiredExperience || '',
    numberOfResourcesRequired: project?.numberOfResourcesRequired || 1,
    department: project?.department || '',
    location: project?.location || '',
    status: project?.status || 'OPEN',
  };
}

function buildSkillsPayload(skills) {
  return (skills || []).filter(s => s.skillName?.trim()).map(s => ({
    skillName: s.skillName.trim(),
    proficiency: s.proficiency || 'Entry Level',
    selfRating: s.selfRating !== '' && s.selfRating != null
      ? Math.min(10, Math.max(1, Math.round(Number(s.selfRating))))
      : null,
    skillDate: s.skillDate || null,
  }));
}

function hasInvalidSkillRating(skills) {
  return (skills || []).some((s) => {
    if (!s.skillName?.trim() || s.selfRating === '' || s.selfRating == null) return false;
    const rating = Number(s.selfRating);
    return Number.isNaN(rating) || rating < 1 || rating > 10;
  });
}

function toEmployeePayload(form, includePassword = true) {
  const payload = {
    employeeCode: form.employeeCode,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    role: form.role,
    phoneNumber: form.phoneNumber,
    department: form.department,
    designation: form.designation,
    joiningDate: nullable(form.joiningDate),
    location: form.location,
    managerId: nullable(form.managerId),
    experienceYears: nullable(form.experienceYears),
    benchStartDate: nullable(form.benchStartDate),
    active: form.active,
    skills: buildSkillsPayload(form.skills),
    certifications: textToCertifications(form.certificationsText),
    projectHistory: textToProjectHistory(form.projectHistoryText),
  };

  if (form.role !== 'PROJECT_ADMINISTRATOR' && form.role !== 'PROJECT_ADMIN' && form.role !== 'CLIENT') {
    payload.status = form.status;
  }

  if (includePassword || form.password.trim()) {
    payload.password = form.password.trim();
  }

  return payload;
}

function toSelfServicePayload(form) {
  return {
    phoneNumber: form.phoneNumber,
    location: form.location,
    experienceYears: nullable(form.experienceYears),
    skills: buildSkillsPayload(form.skills),
    certifications: textToCertifications(form.certificationsText),
  };
}

function toProjectPayload(form) {
  return {
    projectName: form.projectName,
    description: form.description,
    requiredSkills: splitText(form.requiredSkillsText),
    requiredExperience: nullable(form.requiredExperience),
    numberOfResourcesRequired: Number(form.numberOfResourcesRequired),
    department: form.department,
    location: form.location,
    status: form.status,
  };
}

export default function SRHHomepage({
  currentUser,
  onLogout,
  onGoToDemand,
  onGoToInterviews,
}) {
  const role =
    currentUser?.role === 'PROJECT_ADMIN'
      ? 'PROJECT_ADMINISTRATOR'
      : currentUser?.role;
  const isAdmin = role === 'ADMIN';
  const isProjectAdministrator = role === 'PROJECT_ADMINISTRATOR';
  const canManageEmployees = isAdmin;
  const canViewEmployees = isAdmin || isProjectAdministrator;
  const canImportEmployees = isAdmin;
  const canManageDemand = isProjectAdministrator;
  const landingView = canManageDemand
    ? 'Demand'
    : canViewEmployees
      ? 'Employees'
      : 'Profile';

  const [activeNav, setActiveNav] = useState(landingView);
  const [profile, setProfile] = useState(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeFormPresetRole, setEmployeeFormPresetRole] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(DEFAULT_EMPLOYEE_FORM);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_EMPLOYEE_FORM);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(DEFAULT_PROJECT_FORM);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [matchedEmployees, setMatchedEmployees] = useState([]);
  const [isLoadingMatched, setIsLoadingMatched] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [isLoadingResets, setIsLoadingResets] = useState(false);
  const [resetActionId, setResetActionId] = useState(null);

  useEffect(() => {
    if (canManageDemand && onGoToDemand) {
      onGoToDemand();
    }
  }, [canManageDemand, onGoToDemand]);

  const navItems = useMemo(
    () => [
      'Profile',
      ...(canViewEmployees ? ['Employees'] : []),
      ...(isAdmin ? ['Clients', 'Admins', 'Password Resets'] : []),
      ...(canManageDemand ? ['Demand'] : []),
      ...(role === 'EMPLOYEE' ? ['Interview Status'] : []),
      ...(canImportEmployees ? ['Bulk Import'] : []),
    ],
    [canImportEmployees, canManageDemand, canViewEmployees, isAdmin, role],
  );

  function withProjectInfo(employee) {
    const assignment = employee?.projectAssignments?.[0];
    return {
      ...employee,
      projectName: assignment?.projectName,
      clientName: assignment?.clientName,
      jobDescription: assignment?.projectDescription,
    };
  }

  const visibleEmployees = useMemo(() => {
    const base = canViewEmployees
      ? employees.filter((employee) => employee.role === 'EMPLOYEE')
      : profile
        ? [profile]
        : [];
    return base.map(withProjectInfo);
  }, [employees, canViewEmployees, profile]);

  const visibleClients = useMemo(
    () => employees.filter((employee) => employee.role === 'CLIENT'),
    [employees],
  );

  const visibleAdmins = useMemo(
    () => employees.filter((employee) => employee.role === 'ADMIN'),
    [employees],
  );

  const metrics = useMemo(
    () => ({
      bench: visibleEmployees.filter(
        (employee) => employee.status === 'ON_BENCH',
      ).length,
      shortlisted: visibleEmployees.filter(
        (employee) => employee.status === 'SHORTLISTED',
      ).length,
      allocated: visibleEmployees.filter(
        (employee) => employee.status === 'ALLOCATED',
      ).length,
      total: visibleEmployees.length,
      demand: projects.length,
      clients: visibleClients.length,
      admins: visibleAdmins.length,
    }),
    [
      projects.length,
      visibleEmployees,
      visibleClients.length,
      visibleAdmins.length,
    ],
  );

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setStatus('');

      try {
        const profileResponse = await fetch(
          `${API_BASE_URL}/api/employees/me`,
          {
            headers: authHeaders(currentUser?.token),
          },
        );

        if (!profileResponse.ok) {
          throw new Error('Session expired or profile access denied.');
        }

        setProfile(withProjectInfo(await profileResponse.json()));

        if (canViewEmployees) {
          const employeesResponse = await fetch(
            `${API_BASE_URL}/api/admin/employees`,
            {
              headers: authHeaders(currentUser?.token),
            },
          );

          if (!employeesResponse.ok) {
            throw new Error('Employee list access denied for this role.');
          }

          setEmployees(await employeesResponse.json());
        }

        if (canManageDemand) {
          const projectsResponse = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: authHeaders(currentUser?.token),
          });

          if (!projectsResponse.ok) {
            throw new Error('Demand management access denied for this role.');
          }

          setProjects(await projectsResponse.json());
        }
      } catch (error) {
        setStatus(error.message || 'Could not load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [canManageDemand, canViewEmployees, currentUser?.token]);

  async function fetchMatchedEmployees(projectId) {
    setIsLoadingMatched(true);
    setStatus('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/matched-employees`,
        {
          headers: authHeaders(currentUser?.token),
        },
      );
      if (!response.ok) {
        throw new Error('Could not fetch matched employees.');
      }
      const data = await response.json();
      setMatchedEmployees(data);
      setSelectedEmployeeIds([]);
    } catch (error) {
      setStatus(error.message || 'Error fetching matched employees.');
    } finally {
      setIsLoadingMatched(false);
    }
  }

  useEffect(() => {
    if (selectedProject?.id && activeNav === 'ProjectDashboard') {
      fetchMatchedEmployees(selectedProject.id);
    }
  }, [selectedProject?.id, activeNav]);

  async function fetchPasswordResetRequests() {
    setIsLoadingResets(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/password-reset-requests`,
        {
          headers: authHeaders(currentUser?.token),
        },
      );
      if (!response.ok)
        throw new Error('Could not load password reset requests.');
      setPasswordResetRequests(await response.json());
    } catch (error) {
      setStatus(error.message || 'Could not load password reset requests.');
    } finally {
      setIsLoadingResets(false);
    }
  }

  useEffect(() => {
    if (isAdmin && activeNav === 'Password Resets') {
      fetchPasswordResetRequests();
    }
  }, [isAdmin, activeNav]);

  async function handleResetAction(id, action) {
    setResetActionId(id);
    setStatus('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/password-reset-requests/${id}/${action}`,
        {
          method: 'POST',
          headers: authHeaders(currentUser?.token),
        },
      );
      if (!response.ok) throw new Error(`Could not ${action} this request.`);
      setStatus(
        `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      );
      fetchPasswordResetRequests();
    } catch (error) {
      setStatus(error.message || 'Something went wrong.');
    } finally {
      setResetActionId(null);
    }
  }

  async function handleShortlist(employeeIds) {
    if (!employeeIds || employeeIds.length === 0) {
      setStatus('Please select at least one employee to shortlist.');
      return;
    }
    setStatus('');
    setIsShortlisting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProject.id}/shortlist`,
        {
          method: 'PUT',
          headers: authHeaders(currentUser?.token),
          body: JSON.stringify({ employeeIds }),
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(
          error?.message || 'Could not shortlist selected employees.',
        );
      }
      setStatus(`Successfully shortlisted ${employeeIds.length} employee(s).`);
      fetchMatchedEmployees(selectedProject.id);
      if (canViewEmployees) {
        const employeesResponse = await fetch(
          `${API_BASE_URL}/api/admin/employees`,
          {
            headers: authHeaders(currentUser?.token),
          },
        );
        if (employeesResponse.ok) {
          setEmployees(await employeesResponse.json());
        }
      }
    } catch (error) {
      setStatus(error.message || 'Error shortlisting employees.');
    } finally {
      setIsShortlisting(false);
    }
  }

  function updateEmployeeForm(field, value) {
    setEmployeeForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function updateProjectForm(field, value) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function openEditEmployee(employee) {
    setEditingEmployee(employee);
    setEditForm(employeeToForm(employee));
  }

  function openCreateProject() {
    setEditingProject(null);
    setProjectForm(DEFAULT_PROJECT_FORM);
    setShowProjectForm(true);
  }

  function openEditProject(project) {
    setEditingProject(project);
    setProjectForm(projectToForm(project));
    setShowProjectForm(true);
  }

  function openProjectDashboard(project) {
    setSelectedProject(project);
    setActiveNav('ProjectDashboard');
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();
    if (hasInvalidSkillRating(employeeForm.skills)) {
      setStatus('Self-rating must be between 1 and 10 for each skill.');
      return;
    }
    setStatus('');
    setIsSavingEmployee(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/employees`, {
        method: 'POST',
        headers: authHeaders(currentUser?.token),
        body: JSON.stringify(toEmployeePayload(employeeForm)),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not add user.');
      }

      const createdEmployee = await response.json();
      setEmployees((current) => [createdEmployee, ...current]);
      closeEmployeeForm();
      const isClient = createdEmployee.role === 'CLIENT';
      setActiveNav(isClient ? 'Clients' : 'Employees');
      setStatus(`${fullName(createdEmployee)} was added successfully.`);
    } catch (error) {
      setStatus(error.message || 'Could not add user.');
    } finally {
      setIsSavingEmployee(false);
    }
  }

  async function handleDeleteEmployee(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${fullName(employee)} (${employee.employeeCode})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setStatus('');
    setDeletingEmployeeId(employee.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/employees/${employee.id}`,
        {
          method: 'DELETE',
          headers: authHeaders(currentUser?.token),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not delete employee.');
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id),
      );
      setStatus(`${fullName(employee)} was deleted successfully.`);
    } catch (error) {
      setStatus(error.message || 'Could not delete employee.');
    } finally {
      setDeletingEmployeeId(null);
    }
  }

  async function handleUpdateEmployee(event) {
    event.preventDefault();
    if (!editingEmployee) return;

    const isOwnProfile = editingEmployee.id === profile?.id;
    if (!canManageEmployees && !isOwnProfile) return;
    const useManagedEndpoint = canManageEmployees;

    if (hasInvalidSkillRating(editForm.skills)) {
      setStatus('Self-rating must be between 1 and 10 for each skill.');
      return;
    }

    setStatus('');
    setIsSavingEdit(true);

    try {
      const response = await fetch(
        useManagedEndpoint
          ? `${API_BASE_URL}/api/admin/employees/${editingEmployee.id}`
          : `${API_BASE_URL}/api/employees/me`,
        {
          method: 'PUT',
          headers: authHeaders(currentUser?.token),
          body: JSON.stringify(
            useManagedEndpoint
              ? toEmployeePayload(editForm, false)
              : toSelfServicePayload(editForm),
          ),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not update employee.');
      }

      const updatedEmployee = await response.json();
      if (updatedEmployee.id === profile?.id)
        setProfile(withProjectInfo(updatedEmployee));
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === updatedEmployee.id ? updatedEmployee : employee,
        ),
      );
      setEditingEmployee(null);
      setEditForm(DEFAULT_EMPLOYEE_FORM);
      setStatus(`${fullName(updatedEmployee)} was updated successfully.`);
    } catch (error) {
      setStatus(error.message || 'Could not update employee.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  function MyProjectsSection({ token }) {
    const [myProjects, setMyProjects] = useState([]);

    useEffect(() => {
      fetch(`${API_BASE_URL}/api/employees/me/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then(setMyProjects)
        .catch(() => setMyProjects([]));
    }, [token]);

    if (myProjects.length === 0) return null;

    return (
      <div className="my-projects-section">
        <h3>My Projects</h3>
        {myProjects.map((p) => (
          <div key={`${p.projectId}-${p.roleName}`} className="my-project-card">
            <div>
              <strong>{p.projectName}</strong> — {p.roleName} (
              {p.employeeStatus})
            </div>
            <div>Client: {p.clientName}</div>
            <div>{p.description}</div>
          </div>
        ))}
      </div>
    );
  }

  async function handleSaveProject(event) {
    event.preventDefault();
    setStatus('');
    setIsSavingProject(true);

    try {
      const response = await fetch(
        editingProject
          ? `${API_BASE_URL}/api/projects/${editingProject.id}`
          : `${API_BASE_URL}/api/projects`,
        {
          method: editingProject ? 'PUT' : 'POST',
          headers: authHeaders(currentUser?.token),
          body: JSON.stringify(toProjectPayload(projectForm)),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not save project demand.');
      }

      const savedProject = await response.json();
      setProjects((current) =>
        editingProject
          ? current.map((project) =>
              project.id === savedProject.id ? savedProject : project,
            )
          : [savedProject, ...current],
      );
      setShowProjectForm(false);
      setEditingProject(null);
      setProjectForm(DEFAULT_PROJECT_FORM);
      if (!editingProject) {
        openProjectDashboard(savedProject);
        setStatus(
          `${savedProject.projectName} was created. Select employees to shortlist below.`,
        );
      } else {
        setSelectedProject((current) =>
          current?.id === savedProject.id ? savedProject : current,
        );
        setStatus(`${savedProject.projectName} demand was updated.`);
      }
    } catch (error) {
      setStatus(error.message || 'Could not save project demand.');
    } finally {
      setIsSavingProject(false);
    }
  }

  async function handleDeleteProject(project) {
    setStatus('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project.id}`,
        {
          method: 'DELETE',
          headers: authHeaders(currentUser?.token),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not delete project demand.');
      }

      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
      setStatus(`${project.projectName} demand was deleted.`);
    } catch (error) {
      setStatus(error.message || 'Could not delete project demand.');
    }
  }

  async function handleImportEmployees(event) {
    event.preventDefault();
    if (!importFile) {
      setStatus('Choose a CSV or Excel file first.');
      return;
    }

    setStatus('');
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/employees/import`,
        {
          method: 'POST',
          headers: bearerHeaders(currentUser?.token),
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Could not import employees.');
      }

      const result = await response.json();
      setShowImportForm(false);
      setImportFile(null);
      setStatus(
        `Imported ${result.importedCount} employee(s). Skipped ${result.skippedCount}. ${result.errors?.join(' ') || ''}`,
      );

      const employeesResponse = await fetch(
        `${API_BASE_URL}/api/admin/employees`,
        {
          headers: authHeaders(currentUser?.token),
        },
      );
      if (!employeesResponse.ok) {
        throw new Error(
          'Imported employees, but could not refresh employee list.',
        );
      }

      setEmployees(await employeesResponse.json());
      setActiveNav('Employees');
    } catch (error) {
      setStatus(error.message || 'Could not import employees.');
    } finally {
      setIsImporting(false);
    }
  }

  function openAddEmployee() {
    setEmployeeForm(DEFAULT_EMPLOYEE_FORM);
    setEmployeeFormPresetRole(null);
    setShowEmployeeForm(true);
  }

  function openAddClient() {
    setEmployeeForm({ ...DEFAULT_EMPLOYEE_FORM, role: 'CLIENT' });
    setEmployeeFormPresetRole('CLIENT');
    setShowEmployeeForm(true);
  }

  function closeEmployeeForm() {
    setShowEmployeeForm(false);
    setEmployeeFormPresetRole(null);
    setEmployeeForm(DEFAULT_EMPLOYEE_FORM);
  }

  function renderPeopleTable() {
    const isProfile = activeNav === 'Profile';
    const employeesForTable =
      isProfile && profile ? [profile] : visibleEmployees;
    const showAssignmentColumns = isProfile && profile?.status !== 'ON_BENCH';

    return (
      <div className="table-section">
        <div className="table-header">
          <span className="table-title">
            {isProfile ? 'My Profile' : 'Employees'}
          </span>
          <span className="table-badge">
            {isLoading ? 'Loading' : `${employeesForTable.length} record(s)`}
          </span>
        </div>
        <table className="data-table employee-data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Location</th>
              <th>Experience</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Allocated On</th>
              {showAssignmentColumns ? (
                <>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Job Description</th>
                </>
              ) : null}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employeesForTable.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.employeeCode}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {fullName(employee)}
                </td>
                <td>{employee.email}</td>
                <td>{employee.department || '-'}</td>
                <td>{employee.designation || '-'}</td>
                <td>{employee.location || '-'}</td>
                <td>
                  {employee.experienceYears
                    ? `${employee.experienceYears} yrs`
                    : '-'}
                </td>
                <td className="skills-cell">
                  {(employee.skills || []).slice(0, 3).map((s, i) => (
                    <span
                      key={i}
                      className="skill-tag"
                      title={`Rating: ${s.selfRating ?? 'N/A'} | Since: ${s.skillDate || 'N/A'}`}
                    >
                      {s.skillName}
                      {s.selfRating ? ` ★${s.selfRating}` : ''}
                    </span>
                  ))}
                  {(employee.skills || []).length > 3 && (
                    <span className="skill-tag-more">
                      +{employee.skills.length - 3} more
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`status-pill ${employee.status === 'ON_BENCH' ? 'status-bench' : employee.status === 'ALLOCATED' ? 'status-alloc' : 'status-short'}`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td
                  style={{
                    fontSize: '12px',
                    color: employee.allocationDate ? '#22c55e' : '#7a8fa8',
                  }}
                >
                  {employee.allocationDate || '-'}
                </td>
                {showAssignmentColumns ? (
                  <>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                      {employee.projectName || '-'}
                    </td>
                    <td>{employee.clientName || '-'}</td>
                    <td
                      className="job-desc-cell"
                      title={employee.jobDescription || ''}
                    >
                      {employee.jobDescription || '-'}
                    </td>
                  </>
                ) : null}
                <td>
                  <button
                    className="mini-btn"
                    type="button"
                    onClick={() => openEditEmployee(employee)}
                  >
                    {canManageEmployees || employee.id === profile?.id
                      ? 'Edit'
                      : 'View'}
                  </button>
                  {canManageEmployees && employee.id !== profile?.id ? (
                    <button
                      className="mini-btn danger"
                      type="button"
                      disabled={deletingEmployeeId === employee.id}
                      onClick={() => handleDeleteEmployee(employee)}
                    >
                      {deletingEmployeeId === employee.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderClientsTable() {
    return (
      <div className="table-section">
        <div className="table-header">
          <span className="table-title">Clients</span>
          <span className="table-badge">
            {isLoading ? 'Loading' : `${visibleClients.length} client(s)`}
          </span>
        </div>
        <table className="data-table employee-data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleClients.map((client) => (
              <tr key={client.id}>
                <td>{client.employeeCode}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {fullName(client)}
                </td>
                <td>{client.email}</td>
                <td>{client.phoneNumber || '-'}</td>
                <td>{client.location || '-'}</td>
                <td>
                  <span
                    className={`status-pill ${client.active ? 'status-alloc' : 'status-bench'}`}
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td>
                  <button
                    className="mini-btn"
                    type="button"
                    onClick={() => openEditEmployee(client)}
                  >
                    Edit
                  </button>
                  <button
                    className="mini-btn danger"
                    type="button"
                    disabled={deletingEmployeeId === client.id}
                    onClick={() => handleDeleteEmployee(client)}
                  >
                    {deletingEmployeeId === client.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {visibleClients.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    padding: '24px',
                  }}
                >
                  No clients yet. Click &quot;+ Add Client&quot; to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPasswordResetsTable() {
    return (
      <div className="table-section">
        <div className="table-header">
          <div>
            <span className="table-title">Password Reset Requests</span>
            <p className="table-subtitle-desc">
              Approve or reject employee requests to reset their password
            </p>
          </div>
          <span className="table-badge">
            {isLoadingResets
              ? 'Loading'
              : `${passwordResetRequests.length} request(s)`}
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Resolved At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {passwordResetRequests.map((req) => (
              <tr key={req.id}>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {req.employeeName}
                </td>
                <td>{req.employeeCode}</td>
                <td>
                  <span
                    className={`status-pill ${
                      req.status === 'APPROVED'
                        ? 'status-alloc'
                        : req.status === 'PENDING'
                          ? 'status-short'
                          : 'status-bench'
                    }`}
                    style={
                      req.status === 'REJECTED'
                        ? {
                            color: '#f87171',
                            borderColor: 'rgba(248,113,113,0.35)',
                          }
                        : undefined
                    }
                  >
                    {req.status}
                  </span>
                </td>
                <td style={{ fontSize: '12px' }}>
                  {new Date(req.requestedAt).toLocaleString()}
                </td>
                <td style={{ fontSize: '12px' }}>
                  {req.resolvedAt
                    ? new Date(req.resolvedAt).toLocaleString()
                    : '-'}
                </td>
                <td>
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        className="mini-btn accent"
                        type="button"
                        disabled={resetActionId === req.id}
                        onClick={() => handleResetAction(req.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="mini-btn danger"
                        type="button"
                        disabled={resetActionId === req.id}
                        onClick={() => handleResetAction(req.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
            {passwordResetRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    padding: '24px',
                  }}
                >
                  No password reset requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  function renderAdminsTable() {
    return (
      <div className="table-section">
        <div className="table-header">
          <span className="table-title">System Admins</span>
          <span className="table-badge">
            {isLoading ? 'Loading' : `${visibleAdmins.length} admin(s)`}
          </span>
        </div>
        <table className="data-table employee-data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleAdmins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.employeeCode}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {fullName(admin)}
                </td>
                <td>{admin.email}</td>
                <td>{admin.phoneNumber || '-'}</td>
                <td>{admin.location || '-'}</td>
                <td>
                  <span
                    className={`status-pill ${admin.active ? 'status-alloc' : 'status-bench'}`}
                  >
                    {admin.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className="mini-btn"
                    type="button"
                    onClick={() => openEditEmployee(admin)}
                  >
                    Edit
                  </button>
                  {admin.id !== profile?.id ? (
                    <button
                      className="mini-btn danger"
                      type="button"
                      disabled={deletingEmployeeId === admin.id}
                      onClick={() => handleDeleteEmployee(admin)}
                    >
                      {deletingEmployeeId === admin.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {visibleAdmins.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    padding: '24px',
                  }}
                >
                  No admins found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDemandTable() {
    return (
      <div className="table-section">
        <div className="table-header">
          <div>
            <span className="table-title">Demand Projects</span>
            <p className="table-subtitle-desc">
              Click a project row to open its dashboard and match employees
            </p>
          </div>
          <span className="table-badge">
            {isLoading ? 'Loading' : `${projects.length} project(s)`}
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Skills</th>
              <th>Experience</th>
              <th>Resources</th>
              <th>Department</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="clickable-row"
                style={{ cursor: 'pointer' }}
                onClick={() => openProjectDashboard(project)}
              >
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {project.projectName}
                </td>
                <td>{projectSkillsToText(project.requiredSkills) || '-'}</td>
                <td>{project.requiredExperience || '-'}</td>
                <td>{project.numberOfResourcesRequired}</td>
                <td>{project.department || '-'}</td>
                <td>{project.location || '-'}</td>
                <td>
                  <span className="status-pill status-short">
                    {project.status}
                  </span>
                </td>
                <td>
                  <button
                    className="mini-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditProject(project);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="mini-btn danger"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProjectDashboard() {
    if (!selectedProject) return null;

    const allChecked =
      matchedEmployees.length > 0 &&
      selectedEmployeeIds.length === matchedEmployees.length;

    const handleSelectAll = (e) => {
      if (e.target.checked) {
        setSelectedEmployeeIds(matchedEmployees.map((emp) => emp.id));
      } else {
        setSelectedEmployeeIds([]);
      }
    };

    const handleSelectEmployee = (empId) => {
      setSelectedEmployeeIds((prev) =>
        prev.includes(empId)
          ? prev.filter((id) => id !== empId)
          : [...prev, empId],
      );
    };

    return (
      <div className="project-dashboard">
        <div className="dashboard-header-card">
          <div className="dashboard-header-main">
            <div>
              <div className="dashboard-project-kicker">Project Dashboard</div>
              <h2 className="dashboard-project-name">
                {selectedProject.projectName}
              </h2>
              <p className="dashboard-project-desc">
                {selectedProject.description || 'No description provided.'}
              </p>
            </div>
            <div className="dashboard-project-meta">
              <span
                className={`status-pill status-project-${selectedProject.status.toLowerCase()}`}
              >
                {selectedProject.status}
              </span>
            </div>
          </div>

          <div className="project-details-grid">
            <div className="detail-item">
              <span className="detail-label">Required Skills:</span>
              <span className="detail-value highlighted-skills">
                {projectSkillsToText(selectedProject.requiredSkills) ||
                  'None specified'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Experience Required:</span>
              <span className="detail-value">
                {selectedProject.requiredExperience
                  ? `${selectedProject.requiredExperience} years`
                  : 'Any'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Resources Needed:</span>
              <span className="detail-value">
                {selectedProject.numberOfResourcesRequired}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department:</span>
              <span className="detail-value">
                {selectedProject.department || 'General'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location:</span>
              <span className="detail-value">
                {selectedProject.location || 'Remote'}
              </span>
            </div>
          </div>
        </div>

        <div className="table-section">
          <div className="table-header">
            <div>
              <span className="table-title">
                Matched Employees ({matchedEmployees.length})
              </span>
              <p className="table-subtitle-desc">
                Employees on bench whose skills match the project's required
                skills
              </p>
            </div>
            <div className="table-actions-group">
              <button
                className="btn-primary shortlist-bulk-btn"
                type="button"
                disabled={selectedEmployeeIds.length === 0 || isShortlisting}
                onClick={() => handleShortlist(selectedEmployeeIds)}
              >
                {isShortlisting
                  ? 'Shortlisting...'
                  : `Shortlist Selected (${selectedEmployeeIds.length})`}
              </button>
            </div>
          </div>

          {isLoadingMatched ? (
            <div className="table-loading-spinner">
              Loading matched candidates...
            </div>
          ) : matchedEmployees.length === 0 ? (
            <div className="empty-state project-empty-state">
              <h3>No matching candidates found</h3>
              <p>
                There are currently no employees on the bench whose skills match
                the required skills of this project.
              </p>
            </div>
          ) : (
            <table className="data-table matched-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Experience</th>
                  <th>Matched Skills</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {matchedEmployees.map((employee) => {
                  const isChecked = selectedEmployeeIds.includes(employee.id);
                  const isBench = employee.status === 'ON_BENCH';
                  const empSkills = matchedSkillsText(
                    employee,
                    selectedProject.requiredSkills,
                  );
                  return (
                    <tr
                      key={employee.id}
                      className={isChecked ? 'row-selected' : ''}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectEmployee(employee.id)}
                          disabled={!isBench}
                        />
                      </td>
                      <td>{employee.employeeCode}</td>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {fullName(employee)}
                      </td>
                      <td>{employee.department || '-'}</td>
                      <td>{employee.designation || '-'}</td>
                      <td>
                        {employee.experienceYears
                          ? `${employee.experienceYears} yrs`
                          : '-'}
                      </td>
                      <td className="candidate-skills-cell">{empSkills}</td>
                      <td>
                        <span
                          className={`status-pill ${employee.status === 'ON_BENCH' ? 'status-bench' : employee.status === 'ALLOCATED' ? 'status-alloc' : 'status-short'}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="mini-btn accent"
                          type="button"
                          disabled={!isBench || isShortlisting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShortlist([employee.id]);
                          }}
                        >
                          Shortlist
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="srh-root app-shell">
      <nav>
        <div className="nav-logo">
          <div className="nav-logo-mark">
            <img src={logo} alt="Company Logo" />
          </div>
          Smart Resource Hiring
        </div>
        <div className="nav-links">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setActiveNav(item);
                if (item === 'Interview Status') {
                  onGoToInterviews?.();
                  return;
                }
                if (item !== 'Demand') setSelectedProject(null);
              }}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <span className="nav-user">
            {currentUser?.email} · {role}
          </span>
          <button className="btn-ghost" onClick={onLogout}>
            Sign out
          </button>
          {canManageDemand ? (
            <button
              className="btn-primary"
              onClick={onGoToDemand || openCreateProject}
            >
              + Create Project
            </button>
          ) : null}
          {canImportEmployees ? (
            <button
              className="btn-ghost"
              onClick={() => setShowImportForm(true)}
            >
              Bulk Import
            </button>
          ) : null}
          {canManageEmployees ? (
            <button className="btn-primary" onClick={openAddEmployee}>
              + Add User
            </button>
          ) : null}
        </div>
      </nav>

      <main className="workspace">
        <aside className="preview-sidebar workspace-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark">S</div>
            SRH Portal
          </div>
          <div className="sidebar-section">Workspace</div>
          {navItems.map((item) => (
            <button
              key={item}
              className={`sidebar-item ${activeNav === item || (item === 'Demand' && activeNav === 'ProjectDashboard') ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item);
                if (item === 'Interview Status') {
                  onGoToInterviews?.();
                  return;
                }
                if (item !== 'Demand') setSelectedProject(null);
              }}
              type="button"
            >
              <span>{item.slice(0, 1)}</span>
              {item}
            </button>
          ))}
        </aside>

        <section className="workspace-main">
          <div className="preview-topbar">
            <div>
              <div className="preview-topbar-title">
                {activeNav === 'Demand'
                  ? 'Demand Management'
                  : activeNav === 'Bulk Import'
                    ? 'Bulk Import'
                    : activeNav === 'Profile'
                      ? 'Employee Profile'
                      : activeNav === 'Clients'
                        ? 'Client Management'
                        : activeNav === 'Password Resets'
                          ? 'Password Reset Requests'
                          : activeNav === 'ProjectDashboard'
                            ? 'Project Dashboard'
                            : 'Employee Management'}
              </div>
              <div className="workspace-subtitle">
                {activeNav === 'ProjectDashboard'
                  ? `Matching employees for project: ${selectedProject?.projectName}`
                  : activeNav === 'Clients'
                    ? 'Manage client accounts separately from employees. Clients schedule interviews for shortlisted candidates.'
                    : activeNav === 'Password Resets'
                      ? 'Approve or reject employee password reset requests. Approved employees can then set a new password.'
                      : isAdmin
                        ? 'ADMIN can manually add, edit, and bulk import employee profiles.'
                        : isProjectAdministrator
                          ? 'PROJECT_ADMINISTRATOR can create and manage project demand.'
                          : 'Employees can view their profile and update allowed fields.'}
              </div>
            </div>
            <div className="preview-topbar-right">
              {activeNav === 'ProjectDashboard' ? (
                <button
                  className="mini-btn"
                  type="button"
                  onClick={() => {
                    setActiveNav('Demand');
                    setSelectedProject(null);
                  }}
                >
                  &larr; Back to Demand
                </button>
              ) : null}
              {canManageDemand && activeNav === 'Demand' ? (
                <button
                  className="mini-btn accent"
                  type="button"
                  onClick={openCreateProject}
                >
                  New Demand
                </button>
              ) : null}
              {canImportEmployees && activeNav === 'Bulk Import' ? (
                <button
                  className="mini-btn accent"
                  type="button"
                  onClick={() => setShowImportForm(true)}
                >
                  Upload File
                </button>
              ) : null}
              {canManageEmployees && activeNav === 'Clients' ? (
                <button
                  className="mini-btn accent"
                  type="button"
                  onClick={openAddClient}
                >
                  + Add Client
                </button>
              ) : null}
            </div>
          </div>

          <div className="preview-content workspace-content">
            {activeNav !== 'ProjectDashboard' ? (
              <div className="metrics-row">
                <div className="metric-card cyan">
                  <div className="metric-label">On Bench</div>
                  <div className="metric-value">{metrics.bench}</div>
                  <div className="metric-sub">Available now</div>
                </div>
                <div className="metric-card gold">
                  <div className="metric-label">Shortlisted</div>
                  <div className="metric-value">{metrics.shortlisted}</div>
                  <div className="metric-sub">In consideration</div>
                </div>
                <div className="metric-card green">
                  <div className="metric-label">Allocated</div>
                  <div className="metric-value">{metrics.allocated}</div>
                  <div className="metric-sub">Active projects</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">
                    {canManageDemand ? 'Demands' : 'Profiles'}
                  </div>
                  <div className="metric-value">
                    {canManageDemand ? metrics.demand : metrics.total}
                  </div>
                  <div className="metric-sub">
                    {canManageDemand ? 'Open workspace' : 'Visible records'}
                  </div>
                </div>
                {isAdmin && (
                  <>
                    <div
                      className="metric-card"
                      style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}
                    >
                      <div className="metric-label">Admins</div>
                      <div
                        className="metric-value"
                        style={{ color: '#a78bfa' }}
                      >
                        {metrics.admins}
                      </div>
                      <div className="metric-sub">System admins</div>
                    </div>
                    <div
                      className="metric-card"
                      style={{ borderColor: 'rgba(13, 110, 253, 0.3)' }}
                    >
                      <div className="metric-label">Clients</div>
                      <div
                        className="metric-value"
                        style={{ color: 'var(--cyan)' }}
                      >
                        {metrics.clients}
                      </div>
                      <div className="metric-sub">Client accounts</div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {status ? (
              <div className="employee-form-status">{status}</div>
            ) : null}
            {role === 'EMPLOYEE' && profile?.status === 'SHORTLISTED' ? (
              <div className="employee-form-status" style={{ marginTop: 12 }}>
                You have been shortlisted for an interview. Check Interview
                Status for the latest round updates.
              </div>
            ) : null}

            {activeNav === 'Demand' && canManageDemand
              ? renderDemandTable()
              : null}
            {activeNav === 'Bulk Import' && canImportEmployees ? (
              <div className="empty-state">
                <h2>Bulk employee import</h2>
                <p>
                  Upload a CSV or Excel file with employeeCode, email, password,
                  role, firstName, lastName, department, designation,
                  joiningDate, location, managerId, phoneNumber, status, and
                  experienceYears. To import skills, use skill1Name,
                  skill1Proficiency, skill1SelfRating, skill1Date, then repeat
                  with skill2..., skill3..., and so on.
                </p>
                <button
                  className="btn-primary import-inline-btn"
                  type="button"
                  onClick={() => setShowImportForm(true)}
                >
                  Upload Import File
                </button>
              </div>
            ) : null}
            {activeNav === 'Employees' || activeNav === 'Profile'
              ? renderPeopleTable()
              : null}
            {activeNav === 'Clients' ? renderClientsTable() : null}
            {activeNav === 'Admins' ? renderAdminsTable() : null}
            {activeNav === 'Password Resets'
              ? renderPasswordResetsTable()
              : null}
            {activeNav === 'ProjectDashboard' && selectedProject
              ? renderProjectDashboard()
              : null}
          </div>
        </section>
      </main>

      {canManageEmployees && showEmployeeForm ? (
        <EmployeeModal
          title="Add User"
          kicker="Manual Entry"
          form={employeeForm}
          onChange={updateEmployeeForm}
          onSubmit={handleCreateEmployee}
          onClose={() => setShowEmployeeForm(false)}
          isSaving={isSavingEmployee}
          submitLabel="Save Employee"
          canManageAllFields
          requirePassword
          roleSelection
        />
      ) : null}

      {editingEmployee ? (
        <EmployeeModal
          title={canManageEmployees ? 'Edit Employee' : 'Employee Profile'}
          kicker={
            canManageEmployees
              ? 'Managed Edit'
              : editingEmployee.id === profile?.id
                ? 'Self Service'
                : 'View Only'
          }
          form={editForm}
          onChange={updateEditForm}
          onSubmit={handleUpdateEmployee}
          onClose={() => setEditingEmployee(null)}
          isSaving={isSavingEdit}
          submitLabel="Save Changes"
          canManageAllFields={canManageEmployees}
          readOnly={!canManageEmployees && editingEmployee.id !== profile?.id}
          canEditSkills={
            canManageEmployees && editingEmployee.id !== profile?.id
          }
        />
      ) : null}

      {showProjectForm ? (
        <ProjectModal
          form={projectForm}
          isSaving={isSavingProject}
          isEditing={Boolean(editingProject)}
          onChange={updateProjectForm}
          onSubmit={handleSaveProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      ) : null}

      {showImportForm && canImportEmployees ? (
        <div className="employee-modal-backdrop">
          <div
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <div className="employee-modal-header">
              <div>
                <div className="employee-modal-kicker">Admin Action</div>
                <h2 id="import-title">Bulk Import Employees</h2>
              </div>
              <button
                className="employee-close"
                type="button"
                onClick={() => setShowImportForm(false)}
                aria-label="Close import form"
              >
                X
              </button>
            </div>
            <form className="employee-form" onSubmit={handleImportEmployees}>
              <label className="employee-field">
                <span>CSV or Excel file</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(event) =>
                    setImportFile(event.target.files?.[0] || null)
                  }
                  required
                />
              </label>
              <div className="employee-form-actions">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setShowImportForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import Employees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeModal({
  title,
  kicker,
  form,
  onChange,
  onSubmit,
  onClose,
  isSaving,
  submitLabel,
  canManageAllFields,
  readOnly = false,
  canEditSkills = false,
  requirePassword = false,
  roleSelection = false,
}) {
  const lockManagedFields = !canManageAllFields;
  const disableAll = readOnly;
  const allowSkillEditing = canManageAllFields || canEditSkills;
  const isEmployee = form.role === 'EMPLOYEE';
  const showEmployeeStatus = isEmployee;
  const [step, setStep] = useState(roleSelection ? 'role' : 'fields');
  const activeMeta = ROLE_META[form.role] || ROLE_META.EMPLOYEE;

  const selectRole = (role) => {
    onChange('role', role);
    setStep('fields');
  };

  if (step === 'role') {
    return (
      <div className="employee-modal-backdrop">
        <div
          className="employee-modal employee-modal-wide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="employee-modal-header">
            <div>
              <div className="employee-modal-kicker">
                Step 1 of 2 · Account Type
              </div>
              <h2 id="employee-form-title">Select a role</h2>
            </div>
            <button
              className="employee-close"
              type="button"
              onClick={onClose}
              aria-label="Close employee form"
            >
              X
            </button>
          </div>

          <p className="role-picker-sub">
            Pick the kind of account you want to create. Role-specific details
            appear in the next step.
          </p>
          <div className="role-card-grid">
            {ROLE_OPTIONS.map((role) => {
              const meta = ROLE_META[role];
              const selected = form.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  className={`role-card${selected ? ' selected' : ''}`}
                  onClick={() => selectRole(role)}
                >
                  <span className="role-card-icon">{meta.icon}</span>
                  <span className="role-card-body">
                    <span className="role-card-name">{meta.label}</span>
                    <span className="role-card-tag">{meta.tagline}</span>
                    <span className="role-card-desc">{meta.description}</span>
                  </span>
                  <span className="role-card-arrow" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-modal-backdrop">
      <div
        className="employee-modal employee-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-title"
      >
        <div className="employee-modal-header">
          <div>
            <div className="employee-modal-kicker">
              {roleSelection ? 'Step 2 of 2 · Details' : kicker}
            </div>
            <h2 id="employee-form-title">{title}</h2>
          </div>
          <button
            className="employee-close"
            type="button"
            onClick={onClose}
            aria-label="Close employee form"
          >
            X
          </button>
        </div>

        <form className="employee-form employee-form-grid" onSubmit={onSubmit}>
          {/* Role summary bar */}
          {roleSelection ? (
            <div className="employee-field-wide role-summary">
              <span className="role-summary-info">
                <span className="role-summary-icon">{activeMeta.icon}</span>
                <span className="role-summary-text">
                  <span className="role-summary-label">{activeMeta.label}</span>
                  <span className="role-summary-tag">{activeMeta.tagline}</span>
                </span>
              </span>
              <button
                type="button"
                className="role-summary-change"
                onClick={() => setStep('role')}
              >
                Change role
              </button>
            </div>
          ) : (
            <label className="employee-field">
              <span>Role</span>
              <select
                value={form.role}
                onChange={(e) => onChange('role', e.target.value)}
                disabled={disableAll || lockManagedFields}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* AI Resume uploader - only in add mode */}
          {roleSelection && form.role !== 'CLIENT' ? (
            <div className="employee-field-wide">
              <ResumeUploader
                onExtracted={(data) => {
                  if (data.firstName) onChange('firstName', data.firstName);
                  if (data.lastName) onChange('lastName', data.lastName);
                  if (data.email) onChange('email', data.email);
                  if (data.phoneNumber)
                    onChange('phoneNumber', data.phoneNumber);
                  if (data.department) onChange('department', data.department);
                  if (data.designation)
                    onChange('designation', data.designation);
                  if (data.location) onChange('location', data.location);
                  if (data.experienceYears)
                    onChange('experienceYears', String(data.experienceYears));
                  if (data.skills) onChange('skillsText', data.skills);
                  if (data.certifications)
                    onChange('certificationsText', data.certifications);
                }}
              />
            </div>
          ) : null}

          {/* Always shown fields */}
          <Field
            label="Employee Code"
            value={form.employeeCode}
            onChange={(v) => onChange('employeeCode', v)}
            disabled={disableAll || lockManagedFields}
            required
          />
          <Field
            label="First Name"
            value={form.firstName}
            onChange={(v) => onChange('firstName', v)}
            disabled={disableAll || lockManagedFields}
            required
          />
          <Field
            label="Last Name"
            value={form.lastName}
            onChange={(v) => onChange('lastName', v)}
            disabled={disableAll || lockManagedFields}
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => onChange('email', v)}
            disabled={disableAll || lockManagedFields}
            required
          />
          <Field
            label="Phone Number"
            value={form.phoneNumber}
            onChange={(v) => onChange('phoneNumber', v)}
            disabled={disableAll}
          />
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => onChange('location', v)}
            disabled={disableAll}
          />

          {/* EMPLOYEE-only fields */}
          {isEmployee ? (
            <>
              <Field
                label="Department"
                value={form.department}
                onChange={(v) => onChange('department', v)}
                disabled={disableAll || lockManagedFields}
              />
              <Field
                label="Designation"
                value={form.designation}
                onChange={(v) => onChange('designation', v)}
                disabled={disableAll || lockManagedFields}
              />
              <Field
                label="Joining Date"
                type="date"
                value={form.joiningDate}
                onChange={(v) => onChange('joiningDate', v)}
                disabled={disableAll || lockManagedFields}
              />
              <Field
                label="Experience Years"
                type="number"
                step="0.1"
                value={form.experienceYears}
                onChange={(v) => onChange('experienceYears', v)}
                disabled={disableAll}
              />
              <Field
                label="Manager ID"
                type="number"
                value={form.managerId}
                onChange={(v) => onChange('managerId', v)}
                disabled={disableAll || lockManagedFields}
              />
              {showEmployeeStatus ? (
                <label className="employee-field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    disabled={disableAll || lockManagedFields}
                  >
                    {EMPLOYEE_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <SkillEditor
                skills={form.skills}
                onChange={(v) => onChange('skills', v)}
                disabled={!allowSkillEditing}
              />
            </>
          ) : null}

          {/* Password */}
          {canManageAllFields ? (
            <Field
              label={requirePassword ? 'Temporary Password' : 'Reset Password'}
              type="password"
              value={form.password}
              onChange={(v) => onChange('password', v)}
              minLength={6}
              required={requirePassword}
              placeholder={
                requirePassword ? '' : 'Leave blank to keep existing'
              }
            />
          ) : null}

          {/* Active toggle */}
          {canManageAllFields ? (
            <label className="employee-field employee-toggle">
              <span>Active Account</span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => onChange('active', e.target.checked)}
              />
            </label>
          ) : null}

          <div className="employee-form-actions employee-form-actions-wide">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            {!readOnly ? (
              <button className="btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : submitLabel}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function ResumeUploader({ onExtracted }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resumeStatus, setResumeStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  async function extractTextFromFile(file) {
    // For images/PDFs we send base64 as text description prompt
    // Groq supports text only, so we read file as text if possible
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      // Read as text for txt files, otherwise as base64
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }

  async function processResume(file) {
    if (!file) return;

    const allowed = ['text/plain', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setResumeStatus('Please upload a TXT, PDF, PNG, JPG or WEBP file.');
      return;
    }

    setIsProcessing(true);
    setResumeStatus('Reading resume...');

    try {
      const fileContent = await extractTextFromFile(file);
      setResumeStatus('Extracting details with AI...');

      const prompt = `You are a resume parser. Extract information from this resume and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Resume content:
${fileContent.substring(0, 8000)}

Return this exact JSON structure:
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phoneNumber": "",
  "department": "",
  "designation": "",
  "location": "",
  "experienceYears": 0,
  "skills": "comma separated skill names or structured entries like Java|5|2021-01-31; React|4|2020-08-10",
  "certifications": "comma separated certification names"
}

Rules:
- experienceYears must be a number
- skills can be simple names or structured rows with name, rating, and date
- certifications must be flat comma-separated string
- If a field is not found, use empty string or 0
- Return ONLY the JSON object, nothing else`;

      const groqBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      };

      const authData = localStorage.getItem('srhAuth');
      const token = authData ? JSON.parse(authData).token : '';

      const response = await fetch(`${API_BASE_URL}/api/ai/parse-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(groqBody),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error('Resume API error:', errText);
        throw new Error('AI extraction failed. Check console for details.');
      }

      const result = await response.json();
      const text = result?.choices?.[0]?.message?.content || '';

      let parsed;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse AI response.');
        parsed = JSON.parse(match[0]);
      }

      onExtracted(parsed);
      setResumeStatus('✓ Resume parsed! Review and edit the fields below.');
    } catch (error) {
      setResumeStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) processResume(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processResume(file);
  }

  return (
      <div className="resume-uploader">
        <div className="resume-uploader-label">
          <span className="resume-ai-badge">✦ AI</span>
          Auto-fill from Resume
        </div>
        <label
            className={`resume-drop-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
          <input
              type="file"
              accept=".txt,.pdf,image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
              disabled={isProcessing}
          />
          {isProcessing ? (
              <span className="resume-processing">
            <span className="resume-spinner" />
                {resumeStatus}
          </span>
          ) : (
              <span className="resume-drop-content">
            <span className="resume-drop-icon">📎</span>
            <span className="resume-drop-text">
              Drop resume here or <span className="resume-drop-link">browse</span>
            </span>
            <span className="resume-drop-hint">TXT file works best · PDF and images also supported</span>
          </span>
          )}
        </label>
        {resumeStatus && !isProcessing ? (
            <p className={`resume-status ${resumeStatus.startsWith('✓') ? 'resume-status-ok' : 'resume-status-err'}`}>
              {resumeStatus}
            </p>
        ) : null}
      </div>
  );
}

function ProjectModal({ form, isSaving, isEditing, onChange, onSubmit, onClose }) {
  return (
      <div className="employee-modal-backdrop">
        <div className="employee-modal employee-modal-wide" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
          <div className="employee-modal-header">
            <div>
              <div className="employee-modal-kicker">Demand Management</div>
              <h2 id="project-form-title">{isEditing ? 'Edit Project Demand' : 'Create Project Demand'}</h2>
            </div>
            <button className="employee-close" type="button" onClick={onClose} aria-label="Close project form">X</button>
          </div>

          <form className="employee-form employee-form-grid" onSubmit={onSubmit}>
            <Field label="Project Name" value={form.projectName} onChange={(value) => onChange('projectName', value)} required />
            <Field label="Required Experience" type="number" step="0.1" value={form.requiredExperience} onChange={(value) => onChange('requiredExperience', value)} />
            <label className="employee-field employee-field-wide">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => onChange('description', event.target.value)} />
            </label>
            <Field label="Required Skills" value={form.requiredSkillsText} onChange={(value) => onChange('requiredSkillsText', value)} placeholder="Java, Spring Boot, React" />
            <Field label="Number of Resources Required" type="number" min="1" value={form.numberOfResourcesRequired} onChange={(value) => onChange('numberOfResourcesRequired', value)} required />
            <Field label="Department" value={form.department} onChange={(value) => onChange('department', value)} />
            <Field label="Location" value={form.location} onChange={(value) => onChange('location', value)} />


            <div className="employee-form-actions employee-form-actions-wide">
              <button className="btn-ghost" type="button" onClick={onClose}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Demand'}</button>
            </div>
          </form>
        </div>
      </div>
  );
}

function SkillEditor({ skills = [], onChange, disabled }) {
  const PROFICIENCY_OPTIONS = ['Entry Level', 'Intermediate', 'Advanced'];

  function addSkill() {
    onChange([...skills, { skillName: '', proficiency: 'Entry Level', selfRating: '', skillDate: '' }]);
  }

  function removeSkill(index) {
    onChange(skills.filter((_, i) => i !== index));
  }

  function updateSkill(index, field, value) {
    const updated = skills.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated);
  }

  return (
    <div className="skill-editor employee-field-wide">
      <div className="skill-editor-header">
        <span className="skill-editor-label">Skills</span>
        {!disabled && (
          <button type="button" className="mini-btn accent" onClick={addSkill}>
            + Add Skill
          </button>
        )}
      </div>

      {skills.length === 0 ? (
        <p className="skill-editor-empty">No skills added yet.{!disabled ? ' Click "+ Add Skill" to add one.' : ''}</p>
      ) : (
        <div className="skill-editor-list">
          {/* Header row */}
          <div className="skill-editor-row skill-editor-row-header">
            <span>Skill Name</span>
            <span>Proficiency</span>
            <span>Self Rating (1-10)</span>
            <span>Skill Date</span>
            {!disabled && <span></span>}
          </div>
          {skills.map((skill, index) => (
            <div className="skill-editor-row" key={index}>
              <select
                className="skill-editor-select"
                value={skill.skillName}
                onChange={(e) => updateSkill(index, 'skillName', e.target.value)}
                disabled={disabled}
              >
                <option value="">-- Select Skill --</option>
                {ALL_SKILLS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                className="skill-editor-select"
                value={skill.proficiency}
                onChange={(e) => updateSkill(index, 'proficiency', e.target.value)}
                disabled={disabled}
              >
                {PROFICIENCY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <div className="skill-rating-input">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  className="skill-editor-rating"
                  value={skill.selfRating}
                  onChange={(e) => updateSkill(index, 'selfRating', e.target.value)}
                  disabled={disabled}
                  placeholder="1-10"
                />
                {skill.selfRating && (
                  <span className="skill-rating-stars">
                    {'★'.repeat(Math.min(Math.max(Number(skill.selfRating), 1), 10) > 7 ? 3 : Number(skill.selfRating) > 4 ? 2 : 1)}
                  </span>
                )}
              </div>

              <input
                type="date"
                className="skill-editor-date"
                value={skill.skillDate}
                onChange={(e) => updateSkill(index, 'skillDate', e.target.value)}
                disabled={disabled}
                title="Date when you obtained the certification or started using this skill"
              />

              {!disabled && (
                <button
                  type="button"
                  className="mini-btn danger"
                  onClick={() => removeSkill(index)}
                  title="Remove skill"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, disabled, ...props }) {

  return (
      <label className="employee-field">
        <span>{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} {...props} />
      </label>
  );
}

function MultiSelectDropdown({ label, options, selectedValues = [], onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (option, checked) => {
    let next;
    if (checked) {
      next = [...selectedValues, option];
    } else {
      next = selectedValues.filter(v => v !== option);
    }
    onChange(next);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.multi-select-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="employee-field multi-select-container" style={{ position: 'relative' }}>
      <span>{label}</span>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={toggleOpen}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          color: selectedValues.length ? '#e8edf5' : '#7a8fa8',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '42px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginRight: '8px'
        }}>
          {selectedValues.length ? selectedValues.join(', ') : 'Select skills...'}
        </span>
        <span style={{ fontSize: '10px', color: '#7a8fa8' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="multi-select-options"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#151e2c',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            maxHeight: '220px',
            overflowY: 'auto',
            marginTop: '4px',
            padding: '6px 0'
          }}
        >
          {options.map((option) => {
            const isChecked = selectedValues.includes(option);
            return (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: isChecked ? '#e8edf5' : '#a7b6cb',
                  fontSize: '13px',
                  userSelect: 'none',
                  transition: 'background 0.2s',
                  background: isChecked ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  margin: 0
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? 'rgba(255, 255, 255, 0.04)' : 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  style={{
                    marginRight: '10px',
                    accentColor: '#00d4ff',
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px'
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
