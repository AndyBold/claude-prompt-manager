# Quickstart: Claude Prompt Manager

**Date**: 2026-01-15
**Feature**: 001-config-library-manager

## Installation

```bash
# Install globally via npm
npm install -g claude-prompt-manager

# Verify installation
cpm --version
```

## Quick Start (30 seconds)

### 1. List available configurations

```bash
cpm list
```

Output:
```
Available configurations:

  typescript-react     TypeScript React SPA configuration
  typescript-node      TypeScript Node.js backend/CLI
  python-fastapi       Python FastAPI REST API
  python-django        Python Django full-stack
  go-cli               Go command-line tool
  go-api               Go REST API service
```

### 2. Apply a configuration to your project

```bash
cd my-project
cpm apply typescript-react
```

Output:
```
Applying configuration 'typescript-react' to ./my-project...

  Creating: CLAUDE.md
  Creating: .claude/settings.json

✓ Configuration applied successfully.
```

### 3. Start using Claude Code

Your project now has optimized Claude Code configuration!

```bash
# Open Claude Code in your project
claude
```

---

## Common Workflows

### Find a configuration for your stack

```bash
# Search by language
cpm list --language python

# Search by project type
cpm list --project-type api

# Search by keyword
cpm search "react typescript"
```

### View configuration details before applying

```bash
# See what's included
cpm show typescript-react --files

# Preview what will be created
cpm apply typescript-react --dry-run
```

### Update existing project configuration

```bash
# Merge with existing files (interactive conflict resolution)
cpm apply typescript-react --merge

# Replace existing files
cpm apply typescript-react --force
```

### Create a custom configuration

```bash
# Interactive creation (recommended)
cpm create my-team-config --interactive

# From existing project
cpm create my-team-config --from-project ./my-configured-project

# Extend a starter configuration
cpm create my-react-config --extends typescript-react
```

### Using the Claude Code Skill

For guided, interactive configuration creation:

```bash
# In Claude Code, use the skill
/create-config
```

The skill will guide you through:
1. Naming your configuration
2. Selecting project type and languages
3. Choosing testing approaches
4. Generating optimized CLAUDE.md content

---

## Configuration Structure

When you apply a configuration, these files are created:

```
your-project/
├── CLAUDE.md              # Main Claude Code configuration
└── .claude/
    └── settings.json      # Claude Code settings
```

### CLAUDE.md

The main configuration file that tells Claude Code about your project:

```markdown
# Project Name

## Overview
[Project description and context]

## Architecture
[Technical structure and patterns]

## Guidelines
[Coding standards and practices]

## Testing
[Testing approach and requirements]
```

### .claude/settings.json

```json
{
  "model": "claude-3-opus",
  "context": {
    "include": ["src/**/*", "tests/**/*"],
    "exclude": ["node_modules", "dist"]
  }
}
```

---

## Library Locations

Your configurations are stored at:

| Platform | Path |
|----------|------|
| macOS/Linux | `~/.config/claude-prompt-manager/library/` |
| Windows | `%APPDATA%\claude-prompt-manager\library\` |

Bundled configurations are read-only and located within the installation directory.

---

## Next Steps

1. **Browse configurations**: `cpm list --json | jq .`
2. **Customize your setup**: Edit `CLAUDE.md` after applying
3. **Share with team**: Initialize library as git repo for sharing
4. **Create team standards**: Use `cpm create` to build custom configurations

---

## Getting Help

```bash
# General help
cpm --help

# Command-specific help
cpm apply --help

# Show configuration details
cpm show <config-name>
```
