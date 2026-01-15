/**
 * Create command - create a new configuration
 */

import { Command } from "commander";
import { resolve, join } from "path";
import { readFile } from "fs/promises";
import type { Configuration } from "../../lib/config/types.js";
import type { ProjectType, TestingApproach } from "../../lib/constants.js";
import { PROJECT_TYPES, TESTING_APPROACHES, CLAUDE_MD_FILENAME, CLAUDE_DIR } from "../../lib/constants.js";
import { LibraryManager } from "../../lib/library/index.js";
import { validateConfigId, validateConfiguration } from "../../lib/config/validator.js";
import { getGlobalOptions, handleError, verboseLog } from "../index.js";
import { style, blankLine, printNextSteps } from "../utils/output.js";
import { input, select, multiSelect, type Choice } from "../utils/prompts.js";

/**
 * Create the create command
 */
export function createCreateCommand(): Command {
  const cmd = new Command("create")
    .description("Create a new configuration")
    .argument("<config-id>", "Identifier for new configuration")
    .option("--name <name>", "Display name")
    .option("--description <desc>", "Description")
    .option("--extends <parent>", "Parent configuration to extend")
    .option("--project-type <type...>", "Project type (can be repeated)")
    .option("--language <lang...>", "Language (can be repeated)")
    .option("-t, --tag <tag...>", "Tag (can be repeated)")
    .option("--from-project [path]", "Initialize from existing project's Claude files")
    .option("-i, --interactive", "Guide through creation interactively")
    .action(async (configId: string, options) => {
      try {
        await runCreateCommand(configId, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface CreateOptions {
  name?: string;
  description?: string;
  extends?: string;
  projectType?: string[];
  language?: string[];
  tag?: string[];
  fromProject?: string | boolean;
  interactive?: boolean;
}

async function runCreateCommand(
  configId: string,
  options: CreateOptions,
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Validate config ID
  const idValidation = validateConfigId(configId);
  if (!idValidation.valid) {
    console.error(style.error("Invalid configuration ID:"));
    for (const error of idValidation.errors) {
      console.error(style.dim(`  ${error}`));
    }
    process.exit(1);
  }

  // Create library manager
  const library = new LibraryManager(globalOpts.library);
  await library.initialize();

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Check if config already exists
  if (await library.configurationExists(configId)) {
    console.error(style.error(`Configuration "${configId}" already exists.`));
    console.error(style.dim("Choose a different ID or remove the existing configuration first."));
    process.exit(1);
  }

  verboseLog(`Creating configuration "${configId}"`);

  // Gather configuration details
  let config: Configuration;

  if (options.fromProject) {
    config = await createFromProject(
      configId,
      typeof options.fromProject === "string" ? options.fromProject : ".",
      options
    );
  } else if (options.interactive) {
    config = await createInteractively(configId, library, options);
  } else {
    config = await createFromOptions(configId, options);
  }

  // Validate configuration
  const validation = validateConfiguration(config);
  if (!validation.valid) {
    console.error(style.error("Configuration validation failed:"));
    for (const error of validation.errors) {
      console.error(style.dim(`  ${error}`));
    }
    process.exit(1);
  }

  // Show warnings if any
  for (const warning of validation.warnings) {
    console.log(style.warning(warning));
  }

  // Save configuration
  await library.addConfiguration(config);

  // Output success
  if (globalOpts.json) {
    console.log(JSON.stringify({ id: configId, path: join(library.getLibraryPath(), configId) }, null, 2));
    return;
  }

  console.log(style.success(`Configuration "${configId}" created successfully.`));
  blankLine();
  console.log(`  ${style.dim("Location:")} ${join(library.getLibraryPath(), configId)}`);

  if (config.extends) {
    console.log(`  ${style.dim("Extends:")}  ${config.extends}`);
  }

  printNextSteps([
    `Edit ${join(library.getLibraryPath(), configId, "CLAUDE.md")}`,
    `Run 'cpm show ${configId}' to verify`,
    `Apply with 'cpm apply ${configId} ./your-project'`,
  ]);
}

/**
 * Create configuration from command line options
 */
async function createFromOptions(
  configId: string,
  options: CreateOptions
): Promise<Configuration> {
  const now = new Date();

  const claudeMd = generateDefaultClaudeMd(
    options.name || configId,
    options.projectType?.[0] as ProjectType,
    options.language || []
  );

  return {
    id: configId,
    name: options.name || configId,
    description: options.description || `Configuration for ${configId}`,
    version: "1.0.0",
    extends: options.extends,
    projectTypes: (options.projectType || ["web"]) as ProjectType[],
    languages: options.language || ["typescript"],
    tags: options.tag || [],
    testingApproach: "unit",
    created: now,
    updated: now,
    files: ["CLAUDE.md", ".claude/settings.json"],
    fileContents: [
      {
        path: "CLAUDE.md",
        content: claudeMd,
        type: "markdown",
      },
      {
        path: ".claude/settings.json",
        content: JSON.stringify({ context: { include: ["src/**/*"], exclude: ["node_modules"] } }, null, 2),
        type: "json",
      },
    ],
  };
}

/**
 * Create configuration interactively
 */
async function createInteractively(
  configId: string,
  library: LibraryManager,
  options: CreateOptions
): Promise<Configuration> {
  console.log(style.bold(`Creating configuration: ${configId}`));
  blankLine();

  // Name
  const name = await input("Display name", options.name || configId);

  // Description
  const description = await input("Description", options.description);

  // Project types
  const projectTypeChoices: Choice<ProjectType>[] = PROJECT_TYPES.map((t) => ({
    label: t,
    value: t,
  }));
  const projectTypes = await multiSelect("Project types (select one or more)", projectTypeChoices);

  // Languages
  const languageInput = await input("Languages (comma-separated)", options.language?.join(", ") || "typescript");
  const languages = languageInput.split(",").map((l) => l.trim()).filter(Boolean);

  // Testing approach
  const testingChoices: Choice<TestingApproach>[] = TESTING_APPROACHES.map((t) => ({
    label: t,
    value: t,
  }));
  const testingApproach = await select("Testing approach", testingChoices);

  // Tags
  const tagInput = await input("Tags (comma-separated)", options.tag?.join(", "));
  const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);

  // Parent configuration
  const configs = await library.getAllConfigurations();
  let extendsConfig: string | undefined;

  if (configs.length > 0) {
    const extendChoices: Choice<string | undefined>[] = [
      { label: "None (start fresh)", value: undefined },
      ...configs.map((c) => ({ label: `${c.name} - ${c.description}`, value: c.id })),
    ];
    extendsConfig = await select("Extend an existing configuration?", extendChoices);
  }

  const now = new Date();
  const claudeMd = generateDefaultClaudeMd(name, projectTypes[0], languages);

  return {
    id: configId,
    name,
    description: description || `Configuration for ${name}`,
    version: "1.0.0",
    extends: extendsConfig,
    projectTypes: projectTypes.length > 0 ? projectTypes : ["web"],
    languages: languages.length > 0 ? languages : ["typescript"],
    tags,
    testingApproach,
    created: now,
    updated: now,
    files: ["CLAUDE.md", ".claude/settings.json"],
    fileContents: [
      {
        path: "CLAUDE.md",
        content: claudeMd,
        type: "markdown",
      },
      {
        path: ".claude/settings.json",
        content: JSON.stringify({ context: { include: ["src/**/*"], exclude: ["node_modules"] } }, null, 2),
        type: "json",
      },
    ],
  };
}

/**
 * Create configuration from an existing project
 */
async function createFromProject(
  configId: string,
  projectPath: string,
  options: CreateOptions
): Promise<Configuration> {
  const resolvedPath = resolve(projectPath);
  const now = new Date();

  // Check for CLAUDE.md
  const claudeMdPath = join(resolvedPath, CLAUDE_MD_FILENAME);
  let claudeMdContent: string;

  try {
    claudeMdContent = await readFile(claudeMdPath, "utf-8");
    console.log(style.info(`Found ${CLAUDE_MD_FILENAME} in project`));
  } catch {
    claudeMdContent = generateDefaultClaudeMd(
      options.name || configId,
      options.projectType?.[0] as ProjectType,
      options.language || []
    );
    console.log(style.dim(`No ${CLAUDE_MD_FILENAME} found, using default template`));
  }

  // Check for .claude/settings.json
  const settingsPath = join(resolvedPath, CLAUDE_DIR, "settings.json");
  let settingsContent: string;

  try {
    settingsContent = await readFile(settingsPath, "utf-8");
    console.log(style.info(`Found ${CLAUDE_DIR}/settings.json in project`));
  } catch {
    settingsContent = JSON.stringify({ context: { include: ["src/**/*"], exclude: ["node_modules"] } }, null, 2);
    console.log(style.dim(`No ${CLAUDE_DIR}/settings.json found, using default`));
  }

  return {
    id: configId,
    name: options.name || configId,
    description: options.description || `Configuration extracted from ${projectPath}`,
    version: "1.0.0",
    extends: options.extends,
    projectTypes: (options.projectType || ["web"]) as ProjectType[],
    languages: options.language || ["typescript"],
    tags: options.tag || [],
    testingApproach: "unit",
    created: now,
    updated: now,
    files: ["CLAUDE.md", ".claude/settings.json"],
    fileContents: [
      {
        path: "CLAUDE.md",
        content: claudeMdContent,
        type: "markdown",
      },
      {
        path: ".claude/settings.json",
        content: settingsContent,
        type: "json",
      },
    ],
  };
}

/**
 * Generate default CLAUDE.md content
 */
function generateDefaultClaudeMd(
  name: string,
  _projectType?: ProjectType,
  languages?: string[]
): string {
  const langList = languages && languages.length > 0 ? languages.join(", ") : "TypeScript";

  return `# ${name}

## Overview

This project uses ${langList}. Claude should follow best practices for this technology stack.

## Architecture

Describe the project structure and key architectural decisions here.

## Code Guidelines

### Best Practices

- Follow consistent naming conventions
- Write clean, readable code
- Document public APIs

### Code Style

- Use consistent formatting
- Keep functions small and focused
- Handle errors appropriately

## Testing

Describe the testing approach and requirements here.

## Common Commands

\`\`\`bash
# Add common commands for your project
npm run build
npm run test
\`\`\`
`;
}
