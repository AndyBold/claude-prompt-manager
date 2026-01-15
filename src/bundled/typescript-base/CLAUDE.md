# TypeScript Project

## Overview

This is a TypeScript project. Claude should follow TypeScript best practices and type safety principles.

## Architecture

- **Language**: TypeScript with strict mode enabled
- **Runtime**: Node.js (or browser, adjust as needed)
- **Module System**: ES Modules preferred
- **Package Manager**: npm or yarn

## Code Guidelines

### TypeScript Best Practices

- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/aliases
- Enable strict mode in tsconfig.json
- Use `unknown` instead of `any` when type is truly unknown
- Prefer `const` assertions for literal types

### Code Style

- Use consistent naming: PascalCase for types/classes, camelCase for functions/variables
- Keep functions small and focused (single responsibility)
- Document public APIs with JSDoc comments
- Use early returns to reduce nesting

### Error Handling

- Use typed errors when possible
- Provide meaningful error messages
- Handle async errors with try/catch or .catch()

## Testing

- Write tests for public APIs
- Use describe/it structure for test organization
- Mock external dependencies
- Aim for high coverage of business logic

## Common Commands

```bash
npm run build      # Compile TypeScript
npm run test       # Run tests
npm run lint       # Check code style
npm run format     # Format code
```
