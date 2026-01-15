/**
 * Remove command - remove a configuration from the library
 */

import { Command } from "commander";
import { join } from "path";
import { LibraryManager } from "../../lib/library/index.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, blankLine } from "../utils/output.js";
import { confirmWithText } from "../utils/prompts.js";

/**
 * Create the remove command
 */
export function createRemoveCommand(): Command {
  const cmd = new Command("remove")
    .description("Remove a configuration from the library")
    .argument("<config-id>", "Configuration to remove")
    .option("--force", "Remove without confirmation")
    .action(async (configId: string, options) => {
      try {
        await runRemoveCommand(configId, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface RemoveOptions {
  force?: boolean;
}

async function runRemoveCommand(
  configId: string,
  options: RemoveOptions,
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Get configuration
  const config = await library.getConfiguration(configId);

  // Check if bundled
  if (config.bundled) {
    console.error(style.error(`Cannot remove bundled configuration "${configId}".`));
    console.error(style.dim("Bundled configurations are read-only."));
    process.exit(1);
  }

  const configPath = join(library.getLibraryPath(), configId);

  // Confirm removal
  if (!options.force && !globalOpts.json) {
    console.log(`Remove configuration '${style.cyan(configId)}'?`);
    blankLine();
    console.log(style.dim("  This will permanently delete:"));
    console.log(style.dim(`    ${configPath}/`));
    blankLine();

    const confirmed = await confirmWithText("", "yes");

    if (!confirmed) {
      console.log(style.dim("Removal cancelled."));
      return;
    }
  }

  // Remove configuration
  await library.removeConfig(configId);

  // Output results
  if (globalOpts.json) {
    console.log(JSON.stringify({ id: configId, removed: true }, null, 2));
    return;
  }

  console.log(style.success(`Configuration "${configId}" removed.`));
}
