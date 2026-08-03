# Smart Resource Hiring API Reference

This document describes the production API contract for the Smart Resource Hiring backend.

- Base URL: `http://localhost:8080`
- Interactive docs: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- OpenAPI YAML: `http://localhost:8080/v3/api-docs.yaml`
- Static contract: [`openapi.yaml`](./openapi.yaml)

## API Conventions

All APIs use JSON request and response bodies unless the endpoint states otherwise. Protected endpoints require this header:

```http
Authorization: Bearer <jwt-token>
```

The token is returned by `POST /api/auth/login`. In the local backend configuration, JWT expiry is set to 24 hours.

Employee management APIs require the authenticated user to have the `ADMIN` role. Supported roles are:

```text
ADMIN
EMPLOYEE
CLIENT
PROJECT_ADMIN
PROJECT_ADMINISTRATOR
```

## Error Format

Application-level errors use this response structure:

```json
{
  "timestamp": "2026-06-08T07:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "email: must be a well-formed email address",
  "path": "/api/employees"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | Validation failure, invalid request body, or malformed header |
| `401` | Invalid login credentials or missing/invalid JWT |
| `403` | Authenticated user does not have the required `ADMIN` role |
| `404` | Requested employee does not exist |
| `409` | Employee email already exists |

## Endpoint Summary

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Authenticate a user and issue a JWT |
| `POST` | `/api/auth/logout` | Bearer token | End the client session |
| `GET` | `/api/employees` | `ADMIN` | List all employees |
| `POST` | `/api/employees` | `ADMIN` | Create an employee account |
| `GET` | `/api/employees/{id}` | `ADMIN` | Get one employee by ID |
| `PUT` | `/api/employees/{id}` | `ADMIN` | Update employee fields |
| `DELETE` | `/api/employees/{id}` | `ADMIN` | Delete an employee account |

## Authentication

### POST `/api/auth/login`

Authenticates a registered employee using email and password. Returns a JWT access token with the employee email and role.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Validation:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | Yes | Must be a valid email address |
| `password` | string | Yes | Must not be blank |

Success response: `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBleGFtcGxlLmNvbSJ9.signature",
  "role": "ADMIN",
  "email": "admin@example.com"
}
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `400` | Request body fails validation |
| `401` | Email does not exist or password is incorrect |

Example:

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### POST `/api/auth/logout`

Ends the client session. The backend is currently stateless, so logout is completed by the client discarding the JWT.

Required header:

```http
Authorization: Bearer <jwt-token>
```

Success response: `200 OK`

```text
Logged out successfully
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `400` | Authorization header is missing or does not start with `Bearer ` |

Example:

```bash
curl -X POST "http://localhost:8080/api/auth/logout" \
  -H "Authorization: Bearer <jwt-token>"
```

## Employees

Employee APIs are restricted to authenticated users with the `ADMIN` role. Employee response payloads never include passwords.

### GET `/api/employees`

Returns all employees.

Success response: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "role": "EMPLOYEE"
  },
  {
    "id": 2,
    "name": "Kavya Nair",
    "email": "kavya.nair@example.com",
    "role": "PROJECT_ADMIN"
  }
]
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `401` | JWT is missing, expired, or invalid |
| `403` | JWT is valid but the user is not an `ADMIN` |

Example:

```bash
curl "http://localhost:8080/api/employees" \
  -H "Authorization: Bearer <jwt-token>"
```

### POST `/api/employees`

Creates a new employee account. The supplied password is stored as a BCrypt hash and is never returned in API responses.

Request body:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "password": "employee123",
  "role": "EMPLOYEE"
}
```

Validation:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | Yes | Must not be blank |
| `email` | string | Yes | Must be a valid, unique email address |
| `password` | string | Yes | Must be 6 to 72 characters |
| `role` | string | Yes | Must be one of the supported roles |

Success response: `201 Created`

```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "role": "EMPLOYEE"
}
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `400` | Request body fails validation |
| `401` | JWT is missing, expired, or invalid |
| `403` | JWT is valid but the user is not an `ADMIN` |
| `409` | Another employee already uses the same email |

Example:

```bash
curl -X POST "http://localhost:8080/api/employees" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Sharma","email":"aarav.sharma@example.com","password":"employee123","role":"EMPLOYEE"}'
```

### GET `/api/employees/{id}`

Returns one employee by database ID.

Path parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer | Yes | Employee database ID |

Success response: `200 OK`

```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "role": "EMPLOYEE"
}
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `401` | JWT is missing, expired, or invalid |
| `403` | JWT is valid but the user is not an `ADMIN` |
| `404` | Employee ID does not exist |

Example:

```bash
curl "http://localhost:8080/api/employees/1" \
  -H "Authorization: Bearer <jwt-token>"
```

### PUT `/api/employees/{id}`

Updates an employee. Only supplied fields are changed.

Path parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer | Yes | Employee database ID |

Request body:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "password": "newPassword123",
  "role": "PROJECT_ADMIN"
}
```

Validation:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `name` | string | No | Omit to keep unchanged |
| `email` | string | No | Must be valid and unique when supplied |
| `password` | string | No | Must be 6 to 72 characters when supplied |
| `role` | string | No | Must be one of the supported roles when supplied |

Success response: `200 OK`

```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "aarav.sharma@example.com",
  "role": "PROJECT_ADMIN"
}
```

Failure responses:

| Status | Scenario |
| --- | --- |
| `400` | Request body fails validation |
| `401` | JWT is missing, expired, or invalid |
| `403` | JWT is valid but the user is not an `ADMIN` |
| `404` | Employee ID does not exist |
| `409` | Another employee already uses the same email |

Example:

```bash
curl -X PUT "http://localhost:8080/api/employees/1" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"PROJECT_ADMIN"}'
```

### DELETE `/api/employees/{id}`

Deletes an employee by database ID.

Path parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer | Yes | Employee database ID |

Success response: `204 No Content`

The response body is empty.

Failure responses:

| Status | Scenario |
| --- | --- |
| `401` | JWT is missing, expired, or invalid |
| `403` | JWT is valid but the user is not an `ADMIN` |
| `404` | Employee ID does not exist |

Example:

```bash
curl -X DELETE "http://localhost:8080/api/employees/1" \
  -H "Authorization: Bearer <jwt-token>"
```
