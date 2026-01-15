# CLI Interface Contract: Claude Prompt Manager (cpm)

**Date**: 2026-01-15
**Feature**: 001-config-library-manager

## Overview

The `cpm` CLI provides commands for managing Claude Code configurations.

## Global Options

```
cpm [command] [options]

Options:
  -V, --version          Output version number
  -h, --help             Display help for command
  --library <path>       Override default library path
  --verbose              Enable verbose output
  --json                 Output in JSON format (where supported)
```

---

## Commands

### `cpm list`

List available configurations in the library.

```
cpm list [options]

Options:
  --project-type <type>  Filter by project type (web, api, cli, library, mobile)
  --language <lang>      Filter by language
  --tag <tag>            Filter by tag (can be repeated)
  --bundled              Show only bundled configurations
  --user                 Show only user configurations
  --json                 Output as JSON array

Examples:
  cpm list
  cpm list --language typescript
  cpm list --project-type web --language typescript
  cpm list --tag react --tag frontend
```

**Output (default)**:
```
Available configurations:

  typescript-react     TypeScript React SPA configuration
  typescript-node      TypeScript Node.js backend/CLI
  python-fastapi       Python FastAPI REST API
  python-django        Python Django full-stack
  go-cli               Go command-line tool
  go-api               Go REST API service

Use 'cpm show <name>' for details.
```

**Output (--json)**:
```json
[
  {
    "id": "typescript-react",
    "name": "typescript-react",
    "description": "TypeScript React SPA configuration",
    "projectTypes": ["web", "frontend"],
    "languages": ["typescript", "javascript"],
    "tags": ["react", "spa"]
  }
]
```

---

### `cpm show`

Display details of a specific configuration.

```
cpm show <config-id> [options]

Arguments:
  config-id              Configuration identifier

Options:
  --files                Show list of files included
  --content              Show full file contents
  --resolved             Show inheritance-resolved configuration
  --json                 Output as JSON

Examples:
  cpm show typescript-react
  cpm show typescript-react --files
  cpm show typescript-react --resolved --content
```

**Output (default)**:
```
Configuration: typescript-react

  Description:  TypeScript React SPA configuration
  Version:      1.0.0
  Extends:      typescript-base
  Project Types: web, frontend
  Languages:    typescript, javascript
  Tags:         react, spa, vite
  Testing:      unit-and-integration

  Files (2):
    - CLAUDE.md
    - .claude/settings.json

  Created: 2026-01-15
  Updated: 2026-01-15
```

---

### `cpm apply`

Apply a configuration to a project directory.

```
cpm apply <config-id> [target-path] [options]

Arguments:
  config-id              Configuration to apply
  target-path            Target directory (default: current directory)

Options:
  --force                Replace existing files without prompting
  --merge                Attempt to merge with existing files
  --dry-run              Preview changes without writing files
  --no-interactive       Fail on conflicts instead of prompting

Examples:
  cpm apply typescript-react
  cpm apply typescript-react ./my-project
  cpm apply typescript-react --dry-run
  cpm apply typescript-react --merge
```

**Output (default)**:
```
Applying configuration 'typescript-react' to ./my-project...

  Creating: CLAUDE.md
  Creating: .claude/settings.json

✓ Configuration applied successfully.

  2 files created
  0 files modified
  0 conflicts

Next steps:
  1. Review CLAUDE.md and customize for your project
  2. Adjust .claude/settings.json as needed
```

**Output (conflict)**:
```
Applying configuration 'typescript-react' to ./my-project...

  Creating: .claude/settings.json

Conflict detected: CLAUDE.md

--- Existing ---
# My Project

Custom content here...

--- New ---
# TypeScript React Project

Configuration from library...

Options:
  [k] Keep existing
  [r] Replace with new
  [m] Merge (show combined)

Your choice [k/r/m]:
```

---

### `cpm search`

Search configurations by query.

```
cpm search <query> [options]

Arguments:
  query                  Search term (matches name, description, tags)

Options:
  --project-type <type>  Filter results by project type
  --language <lang>      Filter results by language
  --json                 Output as JSON array

Examples:
  cpm search react
  cpm search "api backend" --language python
```

**Output**:
```
Search results for "react":

  typescript-react     TypeScript React SPA configuration
                       Tags: react, spa, vite

  1 configuration found.
```

---

### `cpm create`

Create a new configuration (CLI mode).

```
cpm create <config-id> [options]

Arguments:
  config-id              Identifier for new configuration

Options:
  --name <name>          Display name
  --description <desc>   Description
  --extends <parent>     Parent configuration to extend
  --project-type <type>  Project type (can be repeated)
  --language <lang>      Language (can be repeated)
  --tag <tag>            Tag (can be repeated)
  --from-project [path]  Initialize from existing project's Claude files
  --interactive          Guide through creation interactively

Examples:
  cpm create my-react-config --extends typescript-react --tag custom
  cpm create my-config --from-project ./my-project
  cpm create my-config --interactive
```

**Output (success)**:
```
Creating configuration 'my-react-config'...

  Location: ~/.config/claude-prompt-manager/library/my-react-config/
  Extends:  typescript-react

✓ Configuration created successfully.

Next steps:
  1. Edit ~/.config/claude-prompt-manager/library/my-react-config/CLAUDE.md
  2. Run 'cpm show my-react-config' to verify
```

---

### `cpm remove`

Remove a configuration from the library.

```
cpm remove <config-id> [options]

Arguments:
  config-id              Configuration to remove

Options:
  --force                Remove without confirmation
  --archive              Archive instead of delete

Examples:
  cpm remove my-old-config
  cpm remove my-old-config --force
```

**Output**:
```
Remove configuration 'my-old-config'?

  This will permanently delete:
    ~/.config/claude-prompt-manager/library/my-old-config/

  Type 'yes' to confirm: yes

✓ Configuration removed.
```

---

### `cpm update`

Update an existing configuration.

```
cpm update <config-id> [options]

Arguments:
  config-id              Configuration to update

Options:
  --name <name>          Update display name
  --description <desc>   Update description
  --add-tag <tag>        Add tag (can be repeated)
  --remove-tag <tag>     Remove tag (can be repeated)
  --bump-version <type>  Bump version (major, minor, patch)

Examples:
  cpm update my-config --add-tag new-tag
  cpm update my-config --bump-version minor
```

---

### `cpm validate`

Validate a configuration.

```
cpm validate <config-id> [options]

Arguments:
  config-id              Configuration to validate

Options:
  --fix                  Attempt to fix validation issues

Examples:
  cpm validate my-config
```

**Output**:
```
Validating configuration 'my-config'...

  ✓ Metadata valid
  ✓ Files exist
  ✓ Inheritance chain valid
  ✓ No circular dependencies

✓ Configuration is valid.
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration not found |
| 3 | Validation error |
| 4 | Conflict (non-interactive mode) |
| 5 | Permission denied |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CPM_LIBRARY_PATH` | Override library path | `~/.config/claude-prompt-manager/library/` |
| `CPM_NO_COLOR` | Disable colored output | unset |
| `CPM_VERBOSE` | Enable verbose logging | unset |
