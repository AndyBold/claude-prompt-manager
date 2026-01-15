/**
 * Update command - update an existing configuration
 */

import { Command } from "commander";
import { LibraryManager } from "../../lib/library/index.js";
import { bumpVersion, updateTimestamps } from "../../lib/config/writer.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, blankLine } from "../utils/output.js";

/**
 * Create the update command
 */
export function createUpdateCommand(): Command {
  const cmd = new Command("update")
    .description("Update an existing configuration")
    .argument("<config-id>", "Configuration to update")
    .option("--name <name>", "Update display name")
    .option("--description <desc>", "Update description")
    .option("--add-tag <tag...>", "Add tag (can be repeated)")
    .option("--remove-tag <tag...>", "Remove tag (can be repeated)")
    .option("--bump-version <type>", "Bump version (major, minor, patch)")
    .action(async (configId: string, options) => {
      try {
        await runUpdateCommand(configId, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface UpdateOptions {
  name?: string;
  description?: string;
  addTag?: string[];
  removeTag?: string[];
  bumpVersion?: "major" | "minor" | "patch";
}

async function runUpdateCommand(
  configId: string,
  options: UpdateOptions,
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
    console.error(style.error(`Cannot update bundled configuration "${configId}".`));
    console.error(style.dim("Create a new configuration that extends it instead."));
    process.exit(1);
  }

  // Track changes
  const changes: string[] = [];

  // Apply updates
  if (options.name) {
    config.name = options.name;
    changes.push(`name → "${options.name}"`);
  }

  if (options.description) {
    config.description = options.description;
    changes.push(`description updated`);
  }

  if (options.addTag && options.addTag.length > 0) {
    for (const tag of options.addTag) {
      if (!config.tags.includes(tag)) {
        config.tags.push(tag);
        changes.push(`tag added: "${tag}"`);
      }
    }
  }

  if (options.removeTag && options.removeTag.length > 0) {
    for (const tag of options.removeTag) {
      const index = config.tags.indexOf(tag);
      if (index !== -1) {
        config.tags.splice(index, 1);
        changes.push(`tag removed: "${tag}"`);
      }
    }
  }

  if (options.bumpVersion) {
    const oldVersion = config.version;
    config.version = bumpVersion(config.version, options.bumpVersion);
    changes.push(`version ${oldVersion} → ${config.version}`);
  }

  if (changes.length === 0) {
    console.log(style.dim("No changes specified."));
    console.log(style.dim("Use --name, --description, --add-tag, --remove-tag, or --bump-version."));
    return;
  }

  // Update timestamps
  const updatedConfig = {
    ...config,
    ...updateTimestamps(config),
  };

  // Save configuration
  await library.updateConfiguration(updatedConfig);

  // Output results
  if (globalOpts.json) {
    console.log(JSON.stringify({ id: configId, changes }, null, 2));
    return;
  }

  console.log(style.success(`Configuration "${configId}" updated.`));
  blankLine();

  for (const change of changes) {
    console.log(`  ${style.dim("•")} ${change}`);
  }
}
