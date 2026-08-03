import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SRHHomepage from './SRHHomepage.jsx';

const admin = {
  token: 'admin-token',
  role: 'ADMIN',
  email: 'admin@example.com',
};
const employee = {
  token: 'employee-token',
  role: 'EMPLOYEE',
  email: 'employee@example.com',
};

describe('SRHHomepage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.endsWith('/api/employees/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, email: 'admin@example.com', role: 'ADMIN', active: true }),
        });
      }
      if (url.endsWith('/api/admin/employees')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url.endsWith('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows admin actions only to admins', () => {
    const { rerender } = render(
      <SRHHomepage currentUser={employee} onLogout={vi.fn()} />,
    );

    expect(
      screen.queryByRole('button', { name: '+ Add User' }),
    ).not.toBeInTheDocument();

    rerender(<SRHHomepage currentUser={admin} onLogout={vi.fn()} />);
    expect(
      screen.getAllByRole('button', { name: '+ Add User' }),
    ).toHaveLength(1);
  });

  it('calls the logout handler', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<SRHHomepage currentUser={employee} onLogout={onLogout} />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('opens and closes the employee form', async () => {
    const user = userEvent.setup();
    render(<SRHHomepage currentUser={admin} onLogout={vi.fn()} />);

    await user.click(
      screen.getAllByRole('button', { name: '+ Add User' })[0],
    );
    expect(
      screen.getByRole('dialog', { name: 'Select a role' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Close employee form' }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Select a role' }),
    ).not.toBeInTheDocument();
  });

  it('submits a new employee with the admin bearer token', async () => {
    const user = userEvent.setup();
    fetch.mockImplementation((url, options) => {
      if (url.endsWith('/api/employees') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 2, firstName: 'New', lastName: 'Person' }),
        });
      }
      if (url.endsWith('/api/employees/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, email: 'admin@example.com', role: 'ADMIN', active: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(<SRHHomepage currentUser={admin} onLogout={vi.fn()} />);

    await user.click(
      screen.getAllByRole('button', { name: '+ Add User' })[0],
    );

    // Step 1: Select role
    await user.click(screen.getByText('Project Administrator'));

    // Step 2: Fill fields
    await user.type(screen.getByLabelText('Employee Code'), 'EMP-123');
    await user.type(screen.getByLabelText('First Name'), 'New');
    await user.type(screen.getByLabelText('Last Name'), 'Person');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Temporary Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Save Employee' }));

    expect(
      await screen.findByText('Employee was added successfully.'),
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/admin/employees',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          employeeCode: 'EMP-123',
          firstName: 'New',
          lastName: 'Person',
          email: 'new@example.com',
          role: 'PROJECT_ADMINISTRATOR',
          phoneNumber: '',
          department: '',
          designation: '',
          joiningDate: null,
          location: '',
          managerId: null,
          experienceYears: null,
          benchStartDate: null,
          active: true,
          skills: [],
          certifications: [],
          projectHistory: [],
          password: 'secret',
        }),
      }),
    );
    expect(screen.getByLabelText('Employee Code')).toHaveValue('');
  });

  it('shows an employee creation error and re-enables saving', async () => {
    const user = userEvent.setup();
    fetch.mockImplementation((url) => {
      if (url.endsWith('/api/employees/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, email: 'admin@example.com', role: 'ADMIN', active: true }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ message: 'Could not add employee. Check your admin login and form values.' }),
      });
    });
    render(<SRHHomepage currentUser={admin} onLogout={vi.fn()} />);

    await user.click(
      screen.getAllByRole('button', { name: '+ Add User' })[0],
    );

    // Step 1: Select role
    await user.click(screen.getByText('Project Administrator'));

    // Step 2: Fill fields
    await user.type(screen.getByLabelText('Employee Code'), 'EMP-123');
    await user.type(screen.getByLabelText('First Name'), 'New');
    await user.type(screen.getByLabelText('Last Name'), 'Person');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Temporary Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Save Employee' }));

    expect(
      await screen.findByText(
        'Could not add employee. Check your admin login and form values.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Employee' })).toBeEnabled();
  });
});
