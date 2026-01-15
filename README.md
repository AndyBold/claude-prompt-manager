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

### `cpm import <file>`

Import an existing prompt file into the configuration library.

```bash
cpm import ./CLAUDE.md                      # Import with interactive prompts
cpm import ./my-prompt.md --name "My Config" --id my-config
cpm import ./CLAUDE.md --non-interactive --name "Auto Import"
```

The import command will prompt you for:
- **Configuration name** - Display name for the configuration
- **Description** - What this configuration is for
- **Configuration ID** - Unique identifier (auto-generated from name if not provided)
- **Project types** - web, api, cli, library, mobile
- **Languages** - TypeScript, Python, Go, etc.
- **Tags** - Additional searchable tags

If importing a markdown file that isn't named `CLAUDE.md`, you'll be asked whether to rename it.

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

A Claude Code skill is included for interactive configuration creation directly within Claude Code.

### Installation

```bash
# Install globally (available in all projects)
cpm install-skill

# Or install to current project only
cpm install-skill --local

# Overwrite existing installation
cpm install-skill --force
```

### Usage

Once installed, invoke the skill in Claude Code:

```
/create-config
```

### What the Skill Does

The skill launches a guided, conversational workflow where Claude will ask you about:

1. **Configuration Name** - A unique identifier (e.g., `my-team-react`, `python-ml-project`)
2. **Description** - What this configuration is for
3. **Project Type** - web, api, cli, library, or mobile
4. **Languages** - TypeScript, Python, Go, Rust, etc.
5. **Testing Approach** - TDD, BDD, unit testing, integration testing
6. **Parent Configuration** - Optionally extend an existing config (e.g., `typescript-base`)

### Output

The skill creates a complete configuration in your library:

```
~/.config/claude-prompt-manager/library/[your-config-name]/
├── config.yaml           # Metadata and settings
├── CLAUDE.md             # Customized Claude Code instructions
└── .claude/
    └── settings.json     # Context include/exclude patterns
```

### Example Prompts

When using `/create-config`, you can be specific about what you need:

```
/create-config

> Create a new configuration for our React Native mobile app with Jest testing

> I want to make a config for Python data science projects using pytest and pandas

> Set up a Go microservice configuration that extends typescript-base

> Create a Rust CLI tool configuration with integration tests
```

### After Creation

Once your configuration is created, use it with the CLI:

```bash
# Apply to a new project
cpm apply my-team-react ./new-project

# View the configuration
cpm show my-team-react --resolved

# Update metadata
cpm update my-team-react --add-tag production

# Share by versioning your library
cd ~/.config/claude-prompt-manager/library
git init && git add . && git commit -m "Add team configurations"
```

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

This project was generated with LLM assistance and is released into the public domain. See [LICENSE](LICENSE) for details.
