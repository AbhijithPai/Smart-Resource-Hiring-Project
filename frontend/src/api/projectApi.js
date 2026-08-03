import { API_BASE_URL } from '../config.js';

const BASE = `${API_BASE_URL}/api`;

function authHeaders() {
  const auth = JSON.parse(localStorage.getItem('srhAuth') || '{}');
  const token = auth.token;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const getAllProjects = () =>
  fetch(`${BASE}/projects`, { headers: authHeaders() }).then(handleResponse);

export const getProjectById = (id) =>
  fetch(`${BASE}/projects/${id}`, { headers: authHeaders() }).then(
    handleResponse,
  );

export const createProject = (data) =>
  fetch(`${BASE}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const updateProject = (id, data) =>
  fetch(`${BASE}/projects/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const updateProjectDuration = (id, startDate, endDate) =>
  fetch(`${BASE}/projects/${id}/duration`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ startDate, endDate }),
  }).then(handleResponse);

export const deleteProject = (id) =>
  fetch(`${BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

export const getMatchingEmployees = (projectId, requirementId) =>
  fetch(`${BASE}/projects/${projectId}/requirements/${requirementId}/matches`, {
    headers: authHeaders(),
  }).then(handleResponse);

export const shortlistEmployees = (projectId, requirementId, employeeIds) =>
  fetch(
    `${BASE}/projects/${projectId}/requirements/${requirementId}/shortlist`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(employeeIds),
    },
  ).then(handleResponse);

export const scheduleInterview = (data) =>
  fetch(`${BASE}/interviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);
