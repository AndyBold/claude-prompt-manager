# Research: Claude Code Configuration Library Manager

**Date**: 2026-01-15
**Feature**: 001-config-library-manager

## Research Summary

This document captures technology decisions, best practices research, and pattern analysis for the Configuration Library Manager implementation.

---

## 1. CLI Framework Selection

**Decision**: Commander.js

**Rationale**:
- Most widely adopted Node.js CLI framework (40k+ GitHub stars)
- Excellent TypeScript support with built-in type definitions
- Simple, declarative API for defining commands and options
- Built-in help generation and error handling
- Minimal learning curve for contributors

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| yargs | More complex API, heavier bundle size |
| oclif | Over-engineered for this scope (plugin system unnecessary) |
| meow | Too minimal, requires more manual work |
| Cliffy | Deno-focused, less Node.js ecosystem support |

---

## 2. Configuration File Format

**Decision**: YAML for metadata, preserve original format for content files

**Rationale**:
- YAML is human-readable and familiar to developers
- Supports comments for documentation inline
- Claude Code configurations (CLAUDE.md) are markdown - preserve as-is
- Settings files may be JSON/YAML - preserve original format
- Metadata file (`config.yaml`) accompanies each configuration

**Configuration Structure**:
```yaml
# config.yaml - metadata for a configuration
name: typescript-react
description: Claude Code configuration for TypeScript React projects
version: 1.0.0
extends: typescript-base  # Optional parent configuration
projectTypes:
  - web
  - frontend
languages:
  - typescript
  - javascript
tags:
  - react
  - frontend
  - spa
testingApproach: unit-and-integration
created: 2026-01-15
updated: 2026-01-15
files:
  - CLAUDE.md
  - .claude/settings.json
```

---

## 3. Inheritance Resolution Strategy

**Decision**: Deep merge with explicit override markers

**Rationale**:
- Parent configurations provide base settings
- Child configurations can override specific sections
- Use `!override` marker in YAML for explicit full replacement
- Files are merged by default, can be excluded with `!exclude`

**Resolution Algorithm**:
1. Load parent configuration recursively (depth-first)
2. Merge metadata (child values override parent)
3. For each file:
   - If child has same file: merge content (markdown sections, JSON keys)
   - If child marks file with `!exclude`: skip file
   - If child marks section with `!override`: replace entire section

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Shallow merge | Too limited, can't preserve parent sections |
| Copy-on-write | More complex, unnecessary for this scale |
| Template variables | Over-engineering for current requirements |

---

## 4. Conflict Resolution for Merging

**Decision**: Interactive diff-based resolution with three modes

**Rationale**:
- Developers expect git-like merge experience
- Per-file granularity gives appropriate control
- Three options (keep/replace/merge) cover all use cases

**Implementation Approach**:
- Use `diff` library to generate unified diffs
- Display diffs with syntax highlighting in terminal
- Prompt user for each conflicting file:
  - `k` - Keep existing (skip this file)
  - `r` - Replace with new (overwrite)
  - `m` - Merge (attempt automatic merge, show conflicts)
- For markdown files: section-level merge using headers as boundaries
- For JSON files: deep merge with conflict markers for same-key different values

---

## 5. Library Storage Location

**Decision**: `~/.config/claude-prompt-manager/` following XDG Base Directory Specification

**Rationale**:
- Cross-platform standard location for user configuration
- Separate from project files, available globally
- Git-friendly for optional version control

**Directory Structure**:
```text
~/.config/claude-prompt-manager/
├── library/              # User's configuration library
│   ├── my-custom-config/
│   │   ├── config.yaml   # Metadata
│   │   ├── CLAUDE.md     # Configuration content
│   │   └── .claude/      # Additional files
│   └── another-config/
├── bundled/              # Symlink to bundled configs (read-only)
└── settings.yaml         # Global tool settings
```

**Platform-Specific Paths**:
- macOS/Linux: `~/.config/claude-prompt-manager/`
- Windows: `%APPDATA%\claude-prompt-manager\`

---

## 6. Claude Code Skill Integration

**Decision**: Markdown-based skill definition in `.claude/commands/`

**Rationale**:
- Follows existing Claude Code skill conventions
- Skills are markdown files with structured prompts
- Skill guides users through interactive configuration creation
- Integrates seamlessly with Claude Code workflow

**Skill Location**: `.claude/commands/create-config.md`

**Skill Capabilities**:
- Prompt for configuration name and description
- Ask about project type, languages, testing approach
- Suggest based on project context (detect existing files)
- Generate configuration files and save to library

---

## 7. Bundled Starter Configurations

**Decision**: Ship 6 starter configurations covering common stacks

**Rationale**:
- Provides immediate value without user setup
- Demonstrates best practices for each stack
- Serves as templates for custom configurations

**Bundled Configurations**:

| Name | Project Type | Languages | Description |
|------|--------------|-----------|-------------|
| typescript-react | web/frontend | TypeScript, JavaScript | React SPA with modern tooling |
| typescript-node | api/cli | TypeScript | Node.js backend or CLI tool |
| python-fastapi | api | Python | FastAPI REST API |
| python-django | web | Python | Django full-stack web app |
| go-cli | cli | Go | Go command-line tool |
| go-api | api | Go | Go REST API service |

**Inheritance Hierarchy**:
```
base (implicit)
├── typescript-base
│   ├── typescript-react
│   └── typescript-node
├── python-base
│   ├── python-fastapi
│   └── python-django
└── go-base
    ├── go-cli
    └── go-api
```

---

## 8. Testing Strategy

**Decision**: Vitest with unit and integration tests

**Rationale**:
- Vitest is fast, TypeScript-native, and Jest-compatible
- Unit tests for core logic (resolver, merger, validator)
- Integration tests for CLI commands and full workflows
- Fixtures for reproducible test scenarios

**Test Structure**:
- `tests/unit/` - Isolated function tests
- `tests/integration/` - End-to-end command tests
- `tests/fixtures/` - Sample configurations and projects

---

## 9. Error Handling Patterns

**Decision**: Structured error types with user-friendly messages

**Error Categories**:
| Category | Example | User Message |
|----------|---------|--------------|
| ConfigNotFound | Configuration "foo" not in library | Configuration "foo" not found. Run `cpm list` to see available configurations. |
| InvalidConfig | Malformed config.yaml | Configuration "foo" has invalid metadata: missing required field "name". |
| ConflictDetected | Existing CLAUDE.md in project | Project already has Claude Code configuration. Use `--force` to replace or `--merge` to combine. |
| InheritanceCycle | A extends B extends A | Circular inheritance detected: A → B → A. Remove cycle to continue. |
| PermissionDenied | Cannot write to target | Cannot write to /path/to/project. Check directory permissions. |

---

## 10. Performance Considerations

**Decision**: Lazy loading and caching for library operations

**Optimizations**:
- Lazy load configuration content (metadata only for listing)
- Cache resolved inheritance chains in memory during session
- Use file system watching for library changes (optional, future)
- Parallel file operations where independent

**Benchmarks** (targets):
- List 100 configurations: <500ms
- Apply configuration (5 files): <2s
- Search with filters: <200ms

---

## Open Questions Resolved

All technical questions from the spec have been resolved:

| Question | Resolution |
|----------|------------|
| Storage location | `~/.config/claude-prompt-manager/` (XDG standard) |
| Configuration format | YAML metadata + preserved content files |
| Inheritance model | Deep merge with override markers |
| CLI framework | Commander.js |
| Testing framework | Vitest |
| Conflict resolution | Interactive diff-based per file |
