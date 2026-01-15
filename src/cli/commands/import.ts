/**
 * Import command - import an existing prompt file into the library
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { basename, extname, resolve } from "path";
import { LibraryManager } from "../../lib/library/index.js";
import { handleError, getGlobalOptions } from "../index.js";
import { style, blankLine } from "../utils/output.js";
import { input, select, multiSelect, Choice } from "../utils/prompts.js";
import { ProjectType, PROJECT_TYPES, getFileType } from "../../lib/constants.js";

const COMMON_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "java",
  "c#",
  "ruby",
  "php",
  "swift",
  "kotlin",
];

/**
 * Create the import command
 */
export function createImportCommand(): Command {
  const cmd = new Command("import")
    .description("Import an existing prompt file into the configuration library")
    .argument("<file>", "Path to the prompt file to import (e.g., CLAUDE.md)")
    .option("-n, --name <name>", "Configuration name")
    .option("-d, --description <desc>", "Configuration description")
    .option("-i, --id <id>", "Configuration ID (defaults to slugified name)")
    .option("--non-interactive", "Fail if prompts would be needed")
    .action(async (file: string, options) => {
      try {
        await runImportCommand(file, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

async function runImportCommand(
  file: string,
  options: {
    name?: string;
    description?: string;
    id?: string;
    nonInteractive?: boolean;
  },
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);
  const filePath = resolve(file);

  // Verify file exists
  if (!existsSync(filePath)) {
    console.error(style.error(`File not found: ${filePath}`));
    process.exit(1);
  }

  // Read the file content
  const content = await readFile(filePath, "utf-8");
  const fileName = basename(filePath);

  console.log(style.bold("Import Prompt to Library"));
  blankLine();
  console.log(`  ${style.dim("File:")} ${filePath}`);
  console.log(`  ${style.dim("Size:")} ${content.length} characters`);
  blankLine();

  // Determine file type
  const fileType = getFileType(fileName);

  // Gather metadata - use options or prompt
  let configName = options.name;
  let configDescription = options.description;
  let configId = options.id;
  let projectTypes: ProjectType[] = [];
  let languages: string[] = [];
  let tags: string[] = [];

  if (options.nonInteractive) {
    if (!configName) {
      console.error(style.error("--name is required in non-interactive mode"));
      process.exit(1);
    }
    if (!configDescription) {
      configDescription = `Imported from ${fileName}`;
    }
  } else {
    // Interactive prompts for metadata
    console.log(style.bold("Configuration Metadata"));
    blankLine();

    // Name
    if (!configName) {
      const defaultName = basename(fileName, extname(fileName))
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      configName = await input("Configuration name", defaultName);
    }

    // Description
    if (!configDescription) {
      configDescription = await input(
        "Description",
        `Claude Code configuration imported from ${fileName}`
      );
    }

    // ID
    if (!configId) {
      const defaultId = configName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      configId = await input("Configuration ID", defaultId);
    }

    // Project types
    blankLine();
    const projectTypeChoices: Choice<ProjectType>[] = PROJECT_TYPES.map((t) => ({
      label: t,
      value: t,
    }));
    const selectedProjectTypes = await multiSelect<ProjectType>(
      "Project types (enter numbers separated by commas):",
      projectTypeChoices
    );
    projectTypes = selectedProjectTypes;

    // Languages
    blankLine();
    const languageChoices: Choice<string>[] = COMMON_LANGUAGES.map((l) => ({
      label: l,
      value: l,
    }));
    const selectedLanguages = await multiSelect<string>(
      "Languages (enter numbers separated by commas):",
      languageChoices
    );
    languages = selectedLanguages;

    // Tags
    blankLine();
    const tagsInput = await input("Tags (comma-separated, optional)", "");
    if (tagsInput.trim()) {
      tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  // Generate ID if not provided
  if (!configId) {
    configId = configName!
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Check if config already exists
  const existing = await library.listConfigurations();
  if (existing.some((c) => c.id === configId)) {
    console.error(style.error(`Configuration '${configId}' already exists`));
    console.log(style.dim("Use a different ID or remove the existing configuration first."));
    process.exit(1);
  }

  // Determine target filename
  let targetFileName = fileName;
  if (fileType === "markdown" && fileName.toLowerCase() !== "claude.md") {
    // Ask if they want to rename to CLAUDE.md
    if (!options.nonInteractive) {
      blankLine();
      const renameChoice = await select<string>("Save as:", [
        { label: "CLAUDE.md (recommended)", value: "CLAUDE.md" },
        { label: fileName, value: fileName },
      ]);
      targetFileName = renameChoice;
    } else {
      targetFileName = "CLAUDE.md";
    }
  }

  const now = new Date();

  // Create the configuration
  const config = {
    id: configId,
    name: configName!,
    description: configDescription!,
    version: "1.0.0",
    projectTypes: projectTypes.length > 0 ? projectTypes : (["web"] as ProjectType[]),
    languages: languages.length > 0 ? languages : ["typescript"],
    tags,
    files: [targetFileName],
    bundled: false,
    created: now,
    updated: now,
  };

  // Save configuration
  await library.createConfiguration(config, {
    [targetFileName]: { content, type: fileType },
  });

  blankLine();
  console.log(style.success("Configuration imported successfully!"));
  blankLine();
  console.log(`  ${style.dim("ID:")}       ${configId}`);
  console.log(`  ${style.dim("Name:")}     ${configName}`);
  console.log(`  ${style.dim("Location:")} ${library.getLibraryPath()}/${configId}/`);
  blankLine();
  console.log("Next steps:");
  console.log(`  ${style.cyan(`cpm show ${configId}`)}        View the configuration`);
  console.log(`  ${style.cyan(`cpm apply ${configId} ./`)}    Apply to a project`);
  blankLine();
}
