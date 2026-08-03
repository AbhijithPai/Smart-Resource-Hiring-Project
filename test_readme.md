# SRH Test Guide

This project now has isolated backend unit tests and frontend workflow/component tests. The tests are designed to run without PostgreSQL or a running backend/frontend server.

## Dependencies Used

### Backend

The backend test dependencies were already provided by the Spring Boot test starters in `backend/srh-backend/pom.xml`:

- JUnit 5: test framework and assertions
- Mockito: mocks for repositories, services, servlet requests, and collaborators
- Spring Test: `ReflectionTestUtils` for configuring `JwtUtil` in isolation

No new backend dependency was required.

### Frontend

The following dev dependencies were added to `frontend/package.json`:

- `vitest`: Vite-native test runner
- `jsdom`: browser-like DOM environment
- `@testing-library/react`: render and query React components
- `@testing-library/jest-dom`: readable DOM assertions
- `@testing-library/user-event`: realistic user interaction simulation

## What Is Tested

### Backend: 23 tests

- Login with BCrypt passwords
- Plain-text password migration to BCrypt
- Invalid email and password rejection
- Logout token format handling
- Employee list, lookup, create, update, and delete behavior
- Password encoding and preservation rules
- JWT generation, claims, validity, invalid tokens, and expiry
- JWT filter authentication and role authority creation
- BCrypt password encoder and frontend CORS configuration
- Default admin seeding and existing-admin preservation
- Auth and employee controller delegation

The original `@SpringBootTest` context test was removed because it required the configured local PostgreSQL database. The new unit tests are deterministic and database-independent.

### Frontend: 9 tests

- Login form defaults
- Successful login request, session storage, and dashboard navigation
- Rejected login error handling
- Stored session restoration and logout
- Admin-only employee controls
- Logout callback
- Employee form open and close behavior
- Successful employee creation with bearer token
- Employee creation error handling

## Commands

Run backend tests with Java 17 or newer:

```bash
cd backend/srh-backend
./mvnw test
```

Run frontend tests once:

```bash
cd frontend
npm test
```

Run frontend tests continuously while developing:

```bash
cd frontend
npm run test:watch
```

Run frontend quality checks:

```bash
cd frontend
npm run lint
npm run build
```

## TDD Workflow

For each new behavior:

1. Add a failing test that describes the expected result.
2. Run the relevant test command and confirm it fails for the expected reason.
3. Implement the smallest production change that makes the test pass.
4. Refactor while keeping all tests green.
5. Run the complete backend and frontend suites before committing.

## Current Verification

- Frontend tests: passing
- Frontend lint: passing
- Frontend production build: passing
- Backend tests: added but not executed on the current machine because no Java runtime is installed
