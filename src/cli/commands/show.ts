/**
 * Show command - display configuration details
 */

import { Command } from "commander";
import type { Configuration, ResolvedConfiguration } from "../../lib/config/types.js";
import { LibraryManager } from "../../lib/library/index.js";
import { resolveInheritance } from "../../lib/config/resolver.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, formatConfigDetails, blankLine } from "../utils/output.js";

/**
 * Create the show command
 */
export function createShowCommand(): Command {
  const cmd = new Command("show")
    .description("Display details of a specific configuration")
    .argument("<config-id>", "Configuration identifier")
    .option("--files", "Show list of files included")
    .option("--content", "Show full file contents")
    .option("--resolved", "Show inheritance-resolved configuration")
    .action(async (configId: string, options) => {
      try {
        await runShowCommand(configId, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface ShowOptions {
  files?: boolean;
  content?: boolean;
  resolved?: boolean;
}

async function runShowCommand(configId: string, options: ShowOptions, cmd: Command): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Get configuration
  let config: Configuration | ResolvedConfiguration = await library.getConfiguration(configId);

  // Resolve inheritance if requested
  if (options.resolved && config.extends) {
    config = await resolveInheritance(config, async (id) => {
      try {
        return await library.getConfiguration(id);
      } catch {
        return undefined;
      }
    });
  }

  // Output results
  if (globalOpts.json) {
    outputJson(config, options);
  } else {
    outputText(config, options);
  }
}

function outputJson(config: Configuration | ResolvedConfiguration, options: ShowOptions): void {
  const output: Record<string, unknown> = {
    id: config.id,
    name: config.name,
    description: config.description,
    version: config.version,
    extends: config.extends,
    projectTypes: config.projectTypes,
    languages: config.languages,
    tags: config.tags,
    testingApproach: config.testingApproach,
    created: config.created.toISOString(),
    updated: config.updated.toISOString(),
    bundled: config.bundled,
  };

  if (options.files || options.content) {
    output.files = config.files;
  }

  if (options.content && config.fileContents) {
    output.fileContents = config.fileContents.map((f) => ({
      path: f.path,
      type: f.type,
      content: f.content,
    }));
  }

  if ("inheritanceChain" in config) {
    output.inheritanceChain = config.inheritanceChain;
  }

  if ("resolvedFiles" in config && options.content) {
    output.resolvedFiles = config.resolvedFiles.map((f) => ({
      path: f.path,
      type: f.type,
      content: f.content,
    }));
  }

  console.log(JSON.stringify(output, null, 2));
}

function outputText(config: Configuration | ResolvedConfiguration, options: ShowOptions): void {
  console.log(formatConfigDetails(config));

  if ("inheritanceChain" in config && config.inheritanceChain.length > 1) {
    blankLine();
    console.log(style.dim("Inheritance chain:"));
    console.log(`  ${config.inheritanceChain.join(" → ")}`);
  }

  if (options.content && config.fileContents) {
    blankLine();
    console.log(style.bold("File Contents:"));

    const files = "resolvedFiles" in config ? config.resolvedFiles : config.fileContents;

    for (const file of files) {
      blankLine();
      console.log(style.cyan(`--- ${file.path} ---`));
      console.log(file.content);
    }
  }
}
