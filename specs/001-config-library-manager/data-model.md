# Data Model: Claude Code Configuration Library Manager

**Date**: 2026-01-15
**Feature**: 001-config-library-manager

## Entity Overview

```
┌─────────────────────┐       ┌─────────────────────┐
│   Configuration     │       │  ConfigurationFile  │
├─────────────────────┤       ├─────────────────────┤
│ id: string          │ 1───* │ path: string        │
│ name: string        │       │ content: string     │
│ description: string │       │ type: FileType      │
│ version: string     │       └─────────────────────┘
│ extends?: string    │
│ projectTypes: []    │       ┌─────────────────────┐
│ languages: []       │       │      Library        │
│ tags: []            │       ├─────────────────────┤
│ testingApproach?: s │ *───1 │ path: string        │
│ created: Date       │       │ configurations: []  │
│ updated: Date       │       │ bundledPath: string │
│ files: []           │       └─────────────────────┘
└─────────────────────┘
         │
         │ extends (0..1)
         ▼
┌─────────────────────┐
│   Configuration     │
│   (parent)          │
└─────────────────────┘
```

---

## Core Entities

### Configuration

A reusable Claude Code setup with metadata and content files.

```typescript
interface Configuration {
  // Identity
  id: string;              // Unique identifier (directory name)
  name: string;            // Display name
  description: string;     // Human-readable description
  version: string;         // Semantic version (e.g., "1.0.0")

  // Inheritance
  extends?: string;        // Parent configuration ID (optional)

  // Classification
  projectTypes: ProjectType[];  // web, api, cli, library, mobile
  languages: string[];          // typescript, python, go, etc.
  tags: string[];               // Additional searchable tags
  testingApproach?: TestingApproach;  // tdd, bdd, unit, integration

  // Timestamps
  created: Date;
  updated: Date;

  // Content
  files: ConfigurationFile[];
}

type ProjectType = 'web' | 'api' | 'cli' | 'library' | 'mobile' | 'fullstack';
type TestingApproach = 'tdd' | 'bdd' | 'unit' | 'integration' | 'e2e' | 'none';
```

**Validation Rules**:
- `id` must be unique within the library
- `id` must be valid directory name (lowercase, alphanumeric, hyphens)
- `name` required, max 100 characters
- `description` required, max 500 characters
- `version` must follow semver format
- `extends` must reference existing configuration ID (if specified)
- `projectTypes` must contain at least one value
- `languages` must contain at least one value
- Circular inheritance not allowed

---

### ConfigurationFile

A single file within a configuration.

```typescript
interface ConfigurationFile {
  path: string;           // Relative path within configuration
  content: string;        // File content
  type: FileType;         // File type for merge behavior
  override?: boolean;     // If true, replaces parent file entirely
  exclude?: boolean;      // If true, excludes parent file
}

type FileType = 'markdown' | 'json' | 'yaml' | 'text';
```

**Validation Rules**:
- `path` must be relative (no leading `/`)
- `path` must not traverse up (`..`)
- `type` inferred from extension if not specified
- `override` and `exclude` mutually exclusive

---

### Library

The collection of all configurations.

```typescript
interface Library {
  path: string;                      // Library root path
  configurations: Configuration[];   // User configurations
  bundledPath: string;               // Path to bundled configurations
}
```

**Default Paths**:
- macOS/Linux: `~/.config/claude-prompt-manager/library/`
- Windows: `%APPDATA%\claude-prompt-manager\library\`
- Bundled: `{install-dir}/bundled/`

---

### ResolvedConfiguration

A configuration with inheritance fully resolved.

```typescript
interface ResolvedConfiguration extends Configuration {
  resolvedFiles: ConfigurationFile[];  // Merged files from inheritance chain
  inheritanceChain: string[];          // [child, parent, grandparent, ...]
}
```

---

## Supporting Types

### SearchCriteria

Filters for searching the library.

```typescript
interface SearchCriteria {
  query?: string;              // Free-text search (name, description, tags)
  projectTypes?: ProjectType[];
  languages?: string[];
  tags?: string[];
}
```

---

### ApplyOptions

Options for applying a configuration to a project.

```typescript
interface ApplyOptions {
  configId: string;           // Configuration to apply
  targetPath: string;         // Project directory
  mode: ApplyMode;            // How to handle existing files
  dryRun?: boolean;           // Preview changes without writing
}

type ApplyMode = 'create' | 'replace' | 'merge';
```

---

### ApplyResult

Result of applying a configuration.

```typescript
interface ApplyResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  filesSkipped: string[];
  conflicts: ConflictInfo[];
  errors: string[];
}

interface ConflictInfo {
  path: string;
  existingContent: string;
  newContent: string;
  resolution?: 'keep' | 'replace' | 'merge';
}
```

---

### MergeResult

Result of merging file content.

```typescript
interface MergeResult {
  success: boolean;
  content: string;           // Merged content
  hasConflicts: boolean;     // True if manual resolution needed
  conflictMarkers: number;   // Number of conflict markers
}
```

---

## State Transitions

### Configuration Lifecycle

```
┌──────────┐    create    ┌──────────┐    update    ┌──────────┐
│  (none)  │ ───────────► │  draft   │ ───────────► │  active  │
└──────────┘              └──────────┘              └──────────┘
                                                         │
                               delete                    │
                          ◄──────────────────────────────┘
                                                         │
                                                         ▼
                                                   ┌──────────┐
                                                   │ archived │
                                                   └──────────┘
```

**States**:
- `draft`: Configuration being created, not yet validated
- `active`: Valid configuration available in library
- `archived`: Soft-deleted, not shown in listings

---

### Apply Operation States

```
┌─────────┐  detect  ┌──────────┐  resolve  ┌───────────┐  write  ┌──────────┐
│  init   │ ───────► │ analyzing│ ────────► │ resolving │ ──────► │ complete │
└─────────┘          └──────────┘           └───────────┘         └──────────┘
                          │                       │
                          │ conflicts             │ error
                          ▼                       ▼
                    ┌──────────┐           ┌──────────┐
                    │ conflict │           │  failed  │
                    └──────────┘           └──────────┘
                          │
                          │ resolve
                          ▼
                    ┌───────────┐
                    │ resolving │
                    └───────────┘
```

---

## Persistence Format

### config.yaml (Configuration Metadata)

```yaml
name: typescript-react
description: Claude Code configuration for TypeScript React projects
version: 1.0.0
extends: typescript-base
projectTypes:
  - web
  - frontend
languages:
  - typescript
  - javascript
tags:
  - react
  - spa
  - vite
testingApproach: unit-and-integration
created: 2026-01-15T10:00:00Z
updated: 2026-01-15T10:00:00Z
files:
  - path: CLAUDE.md
    type: markdown
  - path: .claude/settings.json
    type: json
```

### Directory Structure

```text
library/
└── typescript-react/
    ├── config.yaml      # Metadata
    ├── CLAUDE.md        # Main Claude configuration
    └── .claude/
        └── settings.json
```

---

## Indexes

For efficient searching, maintain in-memory indexes:

| Index | Key | Value |
|-------|-----|-------|
| byId | configuration.id | Configuration |
| byProjectType | projectType | Configuration[] |
| byLanguage | language | Configuration[] |
| byTag | tag | Configuration[] |
| byParent | extends | Configuration[] |
