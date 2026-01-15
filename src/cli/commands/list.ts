/**
 * List command - display available configurations
 */

import { Command } from "commander";
import type { Configuration, SearchCriteria } from "../../lib/config/types.js";
import type { ProjectType } from "../../lib/constants.js";
import { LibraryManager } from "../../lib/library/index.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, formatConfigListItem, formatListHeader, blankLine } from "../utils/output.js";

/**
 * Create the list command
 */
export function createListCommand(): Command {
  const cmd = new Command("list")
    .description("List available configurations in the library")
    .option("--project-type <type>", "Filter by project type (web, api, cli, library, mobile)")
    .option("--language <lang>", "Filter by language")
    .option("-t, --tag <tag...>", "Filter by tag (can be repeated)")
    .option("--bundled", "Show only bundled configurations")
    .option("--user", "Show only user configurations")
    .action(async (options) => {
      try {
        await runListCommand(options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface ListOptions {
  projectType?: string;
  language?: string;
  tag?: string[];
  bundled?: boolean;
  user?: boolean;
}

async function runListCommand(options: ListOptions, cmd: Command): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path relative to the CLI
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Build search criteria
  const criteria: SearchCriteria = {
    bundledOnly: options.bundled,
    userOnly: options.user,
  };

  if (options.projectType) {
    criteria.projectTypes = [options.projectType as ProjectType];
  }

  if (options.language) {
    criteria.languages = [options.language];
  }

  if (options.tag && options.tag.length > 0) {
    criteria.tags = options.tag;
  }

  // Search configurations
  const configs = await library.searchConfigurations(criteria);

  // Output results
  if (globalOpts.json) {
    outputJson(configs);
  } else {
    outputText(configs, options);
  }
}

function outputJson(configs: Configuration[]): void {
  const output = configs.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    projectTypes: c.projectTypes,
    languages: c.languages,
    tags: c.tags,
    bundled: c.bundled,
  }));

  console.log(JSON.stringify(output, null, 2));
}

function outputText(configs: Configuration[], options: ListOptions): void {
  if (configs.length === 0) {
    console.log(style.dim("No configurations found."));
    if (options.bundled || options.user || options.projectType || options.language || options.tag) {
      console.log(style.dim("Try removing filters to see all configurations."));
    }
    return;
  }

  // Calculate max name length for alignment
  const maxNameLength = Math.max(...configs.map((c) => c.name.length), 20);

  // Group by bundled/user
  const bundled = configs.filter((c) => c.bundled);
  const user = configs.filter((c) => !c.bundled);

  if (bundled.length > 0 && !options.user) {
    console.log(formatListHeader("Bundled configurations:"));
    blankLine();
    for (const config of bundled) {
      console.log(formatConfigListItem(config, maxNameLength));
    }
    blankLine();
  }

  if (user.length > 0 && !options.bundled) {
    console.log(formatListHeader("User configurations:"));
    blankLine();
    for (const config of user) {
      console.log(formatConfigListItem(config, maxNameLength));
    }
    blankLine();
  }

  console.log(style.dim(`Use 'cpm show <name>' for details.`));
}
