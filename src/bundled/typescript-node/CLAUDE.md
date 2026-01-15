# TypeScript Node.js Project

## Overview

This is a TypeScript Node.js project (backend API or CLI tool). Claude should follow Node.js best practices and async patterns.

## Architecture

- **Runtime**: Node.js 20 LTS+
- **Language**: TypeScript with ES Modules
- **Framework**: Express / Fastify / Hono (for APIs) or Commander.js (for CLI)
- **Database**: PostgreSQL / MongoDB / SQLite (adjust as needed)

## Code Guidelines

### Node.js Best Practices

- Use async/await for asynchronous operations
- Handle errors with try/catch and error middleware
- Use environment variables for configuration
- Implement proper logging (structured JSON logs)
- Follow 12-factor app principles

### Project Structure

For APIs:
```
src/
  routes/         # API route handlers
  controllers/    # Business logic
  services/       # External service integrations
  models/         # Data models / ORM entities
  middleware/     # Express/Fastify middleware
  utils/          # Helper functions
```

For CLI:
```
src/
  commands/       # CLI command handlers
  lib/            # Core logic
  utils/          # Helper functions
```

### Error Handling

- Create custom error classes for different error types
- Use error middleware for consistent error responses
- Log errors with context (request ID, user, etc.)
- Never expose internal errors to clients

### Security

- Validate all input (use zod, joi, or similar)
- Sanitize data before database queries
- Use parameterized queries to prevent SQL injection
- Implement rate limiting for APIs
- Use helmet for HTTP security headers

## Testing

- Unit test business logic in isolation
- Integration test API endpoints
- Use fixtures for test data
- Mock external services

## Common Commands

```bash
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run dev        # Start development server with hot reload
npm run test       # Run tests
npm run lint       # Check code style
```
