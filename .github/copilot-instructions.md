# Project Coding Standards

## Goal
Create a clear separation of concerns between application layers, especially between Repositories and Controllers.

## Repository Layer
- Repositories handle data access and persistence only.
- Keep repository functions limited to CRUD operations, query logic, and data mapping.
- Do not implement request validation, business rules, or response shaping in repositories.
- Return raw or normalized data objects, not HTTP responses.
- Example responsibilities:
  - `findUserById(id)`
  - `createTimeEntry(entryData)`
  - `updateProject(projectId, updates)`
  - `deleteTask(taskId)`

## Controller Layer
- Controllers handle request/response coordination and orchestration.
- Validate incoming input and parse request parameters.
- Call repository methods to perform data operations.
- Apply business logic, authorization checks, and response formatting.
- Handle errors and translate them into appropriate HTTP responses.
- Do not contain direct database queries or low-level persistence details.
- Example responsibilities:
  - `handleCreateTimeEntry(req, res)`
  - `handleGetProjectTasks(req, res)`
  - `handleUpdateUser(req, res)`

## Separation Principles
- Repository = data persistence and data retrieval.
- Controller = request handling, business flow, and response generation.
- Keep controllers lightweight by moving reusable data access logic into repositories.
- Keep repositories reusable by avoiding controller-specific behavior.

## File Organization
- `server/src/routes/` or `server/src/controllers/` for controllers and route handlers.
- `server/src/database/` or `server/src/repositories/` for data access modules.

## When to use each layer
- Use a repository when the code touches database models, queries, or storage operations.
- Use a controller when the code handles Express `req`/`res`, authorization, validation, or response objects.

## Review Checklist
- Is this function manipulating raw data only? -> Repository.
- Is this function handling HTTP requests/responses or business flows? -> Controller.
- Are database details hidden behind a repository API? -> Good.
- Is the controller delegating persistence work instead of doing it directly? -> Good.
