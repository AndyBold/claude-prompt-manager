/**
 * Apply command - apply configuration to a project
 */

import { Command } from "commander";
import { resolve } from "path";
import type { ApplyMode } from "../../lib/config/types.js";
import { LibraryManager } from "../../lib/library/index.js";
import { applyConfiguration, applyWithResolvedConflicts } from "../../lib/apply/index.js";
import { getGlobalOptions, handleError, verboseLog } from "../index.js";
import {
  style,
  formatFileOp,
  formatApplyResult,
  blankLine,
  printNextSteps,
} from "../utils/output.js";
import { resolveConflicts, displayResolutionSummary } from "../utils/conflict.js";

/**
 * Create the apply command
 */
export function createApplyCommand(): Command {
  const cmd = new Command("apply")
    .description("Apply a configuration to a project directory")
    .argument("<config-id>", "Configuration to apply")
    .argument("[target-path]", "Target directory (default: current directory)", ".")
    .option("--force", "Replace existing files without prompting")
    .option("--merge", "Attempt to merge with existing files")
    .option("--dry-run", "Preview changes without writing files")
    .option("--no-interactive", "Fail on conflicts instead of prompting")
    .action(async (configId: string, targetPath: string, options) => {
      try {
        await runApplyCommand(configId, targetPath, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface ApplyOptions {
  force?: boolean;
  merge?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
}

async function runApplyCommand(
  configId: string,
  targetPath: string,
  options: ApplyOptions,
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);
  const resolvedPath = resolve(targetPath);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Get configuration
  const config = await library.getConfiguration(configId);

  verboseLog(`Applying configuration "${configId}" to ${resolvedPath}`);
  verboseLog(`Configuration has ${config.files.length} files`);

  // Determine apply mode
  let mode: ApplyMode = "create";
  if (options.force) {
    mode = "replace";
  } else if (options.merge) {
    mode = "merge";
  }

  // Output what we're doing
  if (!globalOpts.json) {
    if (options.dryRun) {
      console.log(style.info(`Previewing configuration '${configId}' for ${resolvedPath}...`));
    } else {
      console.log(`Applying configuration '${style.cyan(configId)}' to ${resolvedPath}...`);
    }
    blankLine();
  }

  // Apply configuration
  const result = await applyConfiguration(
    config,
    {
      configId,
      targetPath: resolvedPath,
      mode,
      dryRun: options.dryRun,
      noInteractive: options.interactive === false,
    },
    async (id) => {
      try {
        return await library.getConfiguration(id);
      } catch {
        return undefined;
      }
    }
  );

  // Handle conflicts with interactive resolution
  if (result.conflicts.length > 0 && !options.dryRun && options.interactive !== false) {
    console.log(
      style.warning(`Found ${result.conflicts.length} conflict(s) that need resolution.`)
    );
    blankLine();

    // Resolve conflicts interactively
    const resolved = await resolveConflicts(result.conflicts);

    // Apply the resolved files
    const resolveResult = await applyWithResolvedConflicts(resolved, resolvedPath);

    // Display summary
    displayResolutionSummary(resolved);
    blankLine();

    // Update result with resolution outcome
    result.filesModified.push(...resolveResult.filesModified);
    result.filesSkipped.push(...resolveResult.filesSkipped);
    result.errors.push(...resolveResult.errors);
    result.conflicts = [];
    result.success = resolveResult.success && result.errors.length === 0;
  }

  // Output results
  if (globalOpts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Show file operations
  for (const file of result.filesCreated) {
    console.log(formatFileOp(options.dryRun ? "create" : "create", file));
  }

  for (const file of result.filesModified) {
    console.log(formatFileOp("modify", file));
  }

  for (const file of result.filesSkipped) {
    console.log(formatFileOp("skip", file));
  }

  blankLine();

  // Show summary
  if (result.success) {
    if (options.dryRun) {
      console.log(style.info("Dry run complete. No files were written."));
    } else {
      console.log(style.success("Configuration applied successfully."));
    }

    blankLine();
    console.log(
      formatApplyResult(
        result.filesCreated.length,
        result.filesModified.length,
        result.filesSkipped.length,
        result.conflicts.length
      )
    );

    // Show next steps
    if (!options.dryRun) {
      printNextSteps([
        "Review CLAUDE.md and customize for your project",
        "Adjust .claude/settings.json as needed",
      ]);
    }
  } else if (result.conflicts.length > 0) {
    // Conflicts exist but not resolved (non-interactive or dry-run)
    console.log(style.warning("Configuration has conflicts that need resolution."));
    console.log(
      style.dim("Run without --dry-run to resolve interactively, or use --force to overwrite.")
    );
    for (const conflict of result.conflicts) {
      console.log(style.dim(`  - ${conflict.path}`));
    }
  } else {
    console.log(style.error("Configuration apply failed."));
    for (const error of result.errors) {
      console.log(style.dim(`  ${error}`));
    }
  }
}
