# TypeScript React Project

## Overview

This is a TypeScript React single-page application. Claude should follow React best practices and modern hooks-based patterns.

## Architecture

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (or Create React App)
- **Styling**: CSS Modules / Tailwind / styled-components (adjust as needed)
- **State Management**: React Context / Zustand / Redux (adjust as needed)
- **Routing**: React Router (if applicable)

## Code Guidelines

### React Best Practices

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript typing for props and state
- Avoid prop drilling - use context or state management

### Component Structure

```
src/
  components/     # Reusable UI components
  pages/          # Route-level components
  hooks/          # Custom hooks
  contexts/       # React contexts
  utils/          # Helper functions
  types/          # TypeScript type definitions
```

### State Management

- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Use Context for cross-cutting concerns (theme, auth)
- Consider external state management for large apps

### Performance

- Use `React.memo` for expensive pure components
- Use `useMemo` and `useCallback` appropriately
- Implement code splitting with `React.lazy`
- Avoid inline function definitions in JSX when possible

## Testing

- Test components with React Testing Library
- Focus on user interactions, not implementation
- Mock API calls and external dependencies
- Write integration tests for critical user flows

## Common Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run test       # Run tests
npm run lint       # Check code style
```
