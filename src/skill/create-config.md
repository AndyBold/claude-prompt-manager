# Create Configuration

Create a new Claude Code configuration template for your library.

## Usage

When invoked, I will guide you through creating a custom Claude Code configuration. This configuration can then be applied to any project using `cpm apply`.

## Process

I will ask you about:

1. **Configuration Name**: A unique identifier for your configuration (e.g., "my-team-react")
2. **Description**: What this configuration is for
3. **Project Type**: The type of project this applies to (web, api, cli, library, mobile)
4. **Languages**: Programming languages used (typescript, python, go, etc.)
5. **Testing Approach**: Your preferred testing methodology (tdd, bdd, unit, integration)
6. **Parent Configuration**: Optionally extend an existing configuration

## Output

I will create:
- A `config.yaml` with your configuration metadata
- A `CLAUDE.md` customized for your project type and preferences
- A `.claude/settings.json` with appropriate context settings

The configuration will be saved to your library at `~/.config/claude-prompt-manager/library/[your-config-name]/`.

## Example Prompts

- "Create a new configuration for our React Native mobile app"
- "I want to make a config for Python data science projects with pytest"
- "Set up a Go microservice configuration based on go-api"

## After Creation

Once created, you can:
- Apply it to a project: `cpm apply [your-config-name]`
- View its details: `cpm show [your-config-name]`
- Update it: `cpm update [your-config-name]`
- Share it by pushing the library to a git repository

---

Let me know what kind of configuration you'd like to create!
