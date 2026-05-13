# Microservices Plan for Time Tracking Store Application

## Overview
This plan splits the existing backend into focused microservices based on the current domain structure:
- authentication and identity
- user management
- project management
- task management
- time tracking and timer flows
- reporting and analytics

## Proposed Services

### 1. Auth Service
Responsibilities:
- login and token issuance
- token validation and user identity
- session metadata

API:
- `POST /auth/login`
- `GET /auth/me`

Notes:
- centralize authentication logic
- provide a shared auth layer for other services

### 2. User Service
Responsibilities:
- user profiles
- registration and self-update
- admin user management

API:
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

Notes:
- owns users data
- exposes safe profile fields only

### 3. Project Service
Responsibilities:
- create/update/archive projects
- manage project metadata

API:
- `GET /projects`
- `GET /projects/:id`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

Notes:
- owns project lifecycle and rules
- keeps project-specific persistence separate

### 4. Task Service
Responsibilities:
- task CRUD
- assignment and status updates
- task filtering by project/user/status

API:
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

Notes:
- should be able to query project/user info through APIs or service contracts

### 5. Time Entry Service
Responsibilities:
- time entry creation, editing, deletion
- timer start/stop/pause/resume
- overlap validation and duration calculation

API:
- `GET /time-entries`
- `GET /time-entries/:id`
- `POST /time-entries`
- `PUT /time-entries/:id`
- `DELETE /time-entries/:id`
- `POST /time-entries/timer/start`
- `POST /time-entries/timer/stop`
- `POST /time-entries/timer/pause`
- `POST /time-entries/timer/resume`
- `GET /time-entries/timer/active`
- `DELETE /time-entries/timer/active`
- `GET /time-entries/timer/all`

Notes:
- this is the core operational service
- enforces permissions and time overlap rules

### 6. Reporting Service
Responsibilities:
- dashboard summaries
- manager overviews
- analytical reports and anomalies

API:
- `GET /reports/my-summary`
- `GET /reports/overview`
- `GET /reports/by-user`
- `GET /reports/by-project`
- `GET /reports/anomalies`
- `GET /reports/drill/user/:userId`
- `GET /reports/drill/project/:projectId`

Notes:
- optimized for read-heavy aggregation
- may use its own reporting model or read replica

## Integration Strategy

### API Gateway
Use a gateway or BFF layer to unify frontend traffic:
- `/api/auth/*` → Auth Service
- `/api/users/*` → User Service
- `/api/projects/*` → Project Service
- `/api/tasks/*` → Task Service
- `/api/time-entries/*` → Time Entry Service
- `/api/reports/*` → Reporting Service

Gateway responsibilities:
- centralize CORS configuration
- forward auth tokens
- provide a single frontend entrypoint

### Data Ownership
- User Service owns `users`
- Project Service owns `projects`
- Task Service owns `tasks`
- Time Entry Service owns `time_entries` and `active_timers`
- Reporting Service owns analytics and summaries

### Communication
- use synchronous HTTP/REST for initial integration
- consider async events later for domain changes between services

## Migration Plan
1. extract each route module into its own service
2. move database schema and access logic into service-local modules
3. create a shared auth validation library
4. introduce an API gateway
5. migrate frontend calls to gateway endpoints
6. add service health checks and logging
7. validate each service independently
8. consider a separate reporting service as the final split

## Recommended Boundaries
- Auth Service = auth and identity
- User Service = profile and admin users
- Project Service = project lifecycle
- Task Service = task management
- Time Entry Service = time tracking and timers
- Reporting Service = analytics and dashboards

> This structure is aligned with your existing backend routes and keeps each service focused on a single business capability.
