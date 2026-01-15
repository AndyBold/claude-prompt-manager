# Claude Prompt Manager (cpm)

A CLI tool to manage a library of reusable Claude Code configurations. Apply pre-configured setups to new projects, merge with existing configurations, and maintain your own library of templates.

## Features

- **Apply configurations** to new or existing projects with intelligent merging
- **Browse and search** bundled and user-created configurations
- **Create custom configurations** interactively or from existing projects
- **Manage your library** with update, validate, and remove commands
- **Configuration inheritance** - extend base configs with project-specific overrides

## Installation

```bash
npm install -g claude-prompt-manager
```

Or install from source:

```bash
git clone https://github.com/AndyBold/claude-prompt-manager.git
cd claude-prompt-manager
make install
make link
```

## Quick Start

```bash
# List available configurations
cpm list

# See details of a configuration
cpm show typescript-react

# Apply a configuration to a new project
cpm apply typescript-react ./my-new-project

# Apply to existing project with merge
cpm apply typescript-react ./existing-project --merge
```

## Commands

### `cpm list`

List all available configurations.

```bash
cpm list                    # List all configurations
cpm list --bundled          # Only bundled configurations
cpm list --user             # Only user configurations
cpm list --json             # Output as JSON
```

### `cpm show <config>`

Display configuration details.

```bash
cpm show typescript-react           # Show metadata
cpm show typescript-react --files   # List included files
cpm show typescript-react --resolved # Show with inheritance resolved
cpm show typescript-react --json    # Output as JSON
```

### `cpm apply <config> <path>`

Apply a configuration to a project directory.

```bash
cpm apply typescript-react ./my-project          # Apply to new project
cpm apply typescript-react ./my-project --merge  # Merge with existing files
cpm apply typescript-react ./my-project --force  # Overwrite existing files
cpm apply typescript-react ./my-project --dry-run # Preview without changes
```

### `cpm search <query>`

Search configurations by keyword.

```bash
cpm search react                        # Search for "react"
cpm search "typescript api"             # Multi-word search
cpm search react --project-type api     # Filter by project type
cpm search react --language typescript  # Filter by language
```

### `cpm create`

Create a new configuration.

```bash
cpm create --interactive                    # Guided creation
cpm create --from-project ./existing        # Extract from existing project
cpm create --name my-config --extends typescript-base
```

### `cpm update <config>`

Update a configuration's metadata.

```bash
cpm update my-config --name "New Name"
cpm update my-config --add-tag newtag
cpm update my-config --remove-tag oldtag
cpm update my-config --bump-version minor
```

### `cpm validate <config>`

Validate a configuration's integrity.

```bash
cpm validate my-config      # Check metadata, files, inheritance
cpm validate my-config --json
```

### `cpm remove <config>`

Remove a user configuration.

```bash
cpm remove my-config        # Remove with confirmation
cpm remove my-config --force # Remove without confirmation
```

## Configuration Format

Configurations are stored as directories containing:

```
my-config/
├── config.yaml      # Metadata and settings
├── CLAUDE.md        # Claude Code instructions
└── .claude/
    └── settings.json # Claude Code settings
```

### config.yaml

```yaml
id: my-config
name: My Configuration
description: A custom Claude Code configuration
version: 1.0.0
extends: typescript-base    # Optional: inherit from another config
projectTypes:
  - web
  - api
languages:
  - typescript
  - javascript
tags:
  - react
  - frontend
files:
  - path: CLAUDE.md
    type: markdown
  - path: .claude/settings.json
    type: json
```

## Bundled Configurations

| Configuration | Description |
|--------------|-------------|
| `typescript-base` | Base TypeScript configuration with best practices |
| `typescript-react` | React SPA with hooks, testing library, Vite |
| `typescript-node` | Node.js backend/CLI with async patterns |

## Library Location

Configurations are stored in:

- **macOS/Linux**: `~/.config/claude-prompt-manager/library/`
- **Windows**: `%APPDATA%\claude-prompt-manager\library\`

Override with `CPM_LIBRARY_PATH` environment variable.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CPM_LIBRARY_PATH` | Custom library location |
| `CPM_NO_COLOR` | Disable colored output |
| `CPM_VERBOSE` | Enable verbose logging |

## Claude Code Skill

A Claude Code skill is included for interactive configuration creation.

### Installation

```bash
# Install globally (available in all projects)
cpm install-skill

# Or install to current project only
cpm install-skill --local
```

### Usage

Once installed, use in Claude Code:

```
/create-config
```

This launches a guided workflow within Claude Code to create new configurations.

## Development

```bash
# Install dependencies
make install

# Build
make build

# Run tests
make test

# Run all checks
make check

# Link for local testing
make link

# Run CLI directly
make run ARGS="list"
```

## License

MIT
