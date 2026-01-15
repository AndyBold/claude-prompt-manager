/**
 * Search command - search configurations by query
 */

import { Command } from "commander";
import type { SearchCriteria } from "../../lib/config/types.js";
import type { ProjectType } from "../../lib/constants.js";
import { LibraryManager } from "../../lib/library/index.js";
import { searchConfigurations } from "../../lib/library/search.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, formatSearchResult, blankLine } from "../utils/output.js";

/**
 * Create the search command
 */
export function createSearchCommand(): Command {
  const cmd = new Command("search")
    .description("Search configurations by query")
    .argument("<query>", "Search term (matches name, description, tags)")
    .option("--project-type <type>", "Filter results by project type")
    .option("--language <lang>", "Filter results by language")
    .action(async (query: string, options) => {
      try {
        await runSearchCommand(query, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

interface SearchOptions {
  projectType?: string;
  language?: string;
}

async function runSearchCommand(
  query: string,
  options: SearchOptions,
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  // Build search criteria
  const criteria: SearchCriteria = {
    query,
  };

  if (options.projectType) {
    criteria.projectTypes = [options.projectType as ProjectType];
  }

  if (options.language) {
    criteria.languages = [options.language];
  }

  // Get all configurations
  const allConfigs = await library.getAllConfigurations();

  // Search
  const results = searchConfigurations(allConfigs, criteria);

  // Output results
  if (globalOpts.json) {
    const output = results.map((r) => ({
      id: r.configuration.id,
      name: r.configuration.name,
      description: r.configuration.description,
      score: r.score,
      matchedFields: r.matchedFields,
      projectTypes: r.configuration.projectTypes,
      languages: r.configuration.languages,
      tags: r.configuration.tags,
      bundled: r.configuration.bundled,
    }));
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(style.dim(`No configurations found for "${query}".`));
    console.log(style.dim("Try a different search term or remove filters."));
    return;
  }

  console.log(`Search results for "${style.cyan(query)}":`);
  blankLine();

  // Calculate max name length for alignment
  const maxNameLength = Math.max(...results.map((r) => r.configuration.name.length), 20);

  for (const result of results) {
    console.log(formatSearchResult(result.configuration, query, maxNameLength));
  }

  blankLine();
  console.log(
    style.dim(`${results.length} configuration${results.length === 1 ? "" : "s"} found.`)
  );
}
