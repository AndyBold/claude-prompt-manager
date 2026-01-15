/**
 * Install skill command - install Claude Code skill to commands directory
 */

import { Command } from "commander";
import { copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { handleError } from "../index.js";
import { style, blankLine } from "../utils/output.js";

/**
 * Get the path to the bundled skill file
 */
function getSkillSourcePath(): string {
  return new URL("../../skill/create-config.md", import.meta.url).pathname;
}

/**
 * Create the install-skill command
 */
export function createInstallSkillCommand(): Command {
  const cmd = new Command("install-skill")
    .description("Install the create-config skill for Claude Code")
    .option("-g, --global", "Install globally to ~/.claude/commands (default)")
    .option("-l, --local", "Install to current project's .claude/commands")
    .option("-f, --force", "Overwrite existing skill file")
    .action(async (options) => {
      try {
        await runInstallSkillCommand(options);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

async function runInstallSkillCommand(options: {
  global?: boolean;
  local?: boolean;
  force?: boolean;
}): Promise<void> {
  const sourcePath = getSkillSourcePath();

  // Check source exists
  if (!existsSync(sourcePath)) {
    console.error(style.error("Skill file not found. Please reinstall the package."));
    process.exit(1);
  }

  // Determine target directory
  let targetDir: string;
  let targetType: string;

  if (options.local) {
    targetDir = join(process.cwd(), ".claude", "commands");
    targetType = "local";
  } else {
    // Default to global
    targetDir = join(homedir(), ".claude", "commands");
    targetType = "global";
  }

  const targetPath = join(targetDir, "create-config.md");

  // Check if already exists
  if (existsSync(targetPath) && !options.force) {
    console.log(style.warning(`Skill already installed at ${targetPath}`));
    console.log(style.dim("Use --force to overwrite."));
    return;
  }

  // Create directory if needed
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
    console.log(style.dim(`Created ${targetDir}`));
  }

  // Copy skill file
  await copyFile(sourcePath, targetPath);

  blankLine();
  console.log(style.success("Claude Code skill installed successfully!"));
  blankLine();
  console.log(`  ${style.dim("Location:")} ${targetPath}`);
  console.log(`  ${style.dim("Type:")}     ${targetType}`);
  blankLine();
  console.log("Usage in Claude Code:");
  console.log(style.cyan("  /create-config"));
  blankLine();
}
