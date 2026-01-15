#!/usr/bin/env node
/**
 * Claude Prompt Manager CLI
 *
 * Entry point for the cpm command-line interface.
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CLI_NAME, ENV_VARS } from "../lib/constants.js";
import { getExitCode, getUserMessage, isCpmError } from "../lib/errors.js";
import { style } from "./utils/output.js";
import type { GlobalOptions } from "../lib/config/types.js";
import { createListCommand } from "./commands/list.js";
import { createShowCommand } from "./commands/show.js";
import { createApplyCommand } from "./commands/apply.js";
import { createCreateCommand } from "./commands/create.js";
import { createSearchCommand } from "./commands/search.js";
import { createUpdateCommand } from "./commands/update.js";
import { createRemoveCommand } from "./commands/remove.js";
import { createValidateCommand } from "./commands/validate.js";

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "..", "package.json");
let version = "0.1.0";

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  version = packageJson.version;
} catch {
  // Use default version if package.json can't be read
}

/**
 * Create the main CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description("Manage a library of Claude Code configurations")
    .version(version, "-V, --version", "Output version number")
    .option("--library <path>", "Override default library path")
    .option("--verbose", "Enable verbose output")
    .option("--json", "Output in JSON format (where supported)")
    .hook("preAction", (thisCommand) => {
      // Set verbose mode via environment variable for child commands
      const opts = thisCommand.opts();
      if (opts.verbose) {
        process.env[ENV_VARS.VERBOSE] = "1";
      }
    });

  return program;
}

/**
 * Get global options from command
 */
export function getGlobalOptions(command: Command): GlobalOptions {
  const opts = command.optsWithGlobals();
  return {
    library: opts.library,
    verbose: opts.verbose,
    json: opts.json,
  };
}

/**
 * Check if verbose mode is enabled
 */
export function isVerbose(): boolean {
  return !!process.env[ENV_VARS.VERBOSE];
}

/**
 * Log verbose output
 */
export function verboseLog(...args: unknown[]): void {
  if (isVerbose()) {
    console.log(style.dim("[verbose]"), ...args);
  }
}

/**
 * Handle errors consistently
 */
export function handleError(error: unknown): never {
  const message = getUserMessage(error);
  const code = getExitCode(error);

  if (isCpmError(error)) {
    console.error(style.error(message));
  } else {
    console.error(style.error("Error:"), message);
    if (isVerbose() && error instanceof Error && error.stack) {
      console.error(style.dim(error.stack));
    }
  }

  process.exit(code);
}

/**
 * Main program instance
 */
const program = createProgram();

// Register commands
program.addCommand(createListCommand());
program.addCommand(createShowCommand());
program.addCommand(createApplyCommand());
program.addCommand(createCreateCommand());
program.addCommand(createSearchCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createValidateCommand());

program.addHelpText(
  "after",
  `
Examples:
  ${CLI_NAME} list                     List available configurations
  ${CLI_NAME} show typescript-react    Show configuration details
  ${CLI_NAME} apply typescript-react   Apply configuration to current directory
  ${CLI_NAME} search react             Search for configurations
  ${CLI_NAME} create my-config         Create a new configuration

Use "${CLI_NAME} <command> --help" for more information about a command.
`
);

// Export program for command registration
export { program };

// Run CLI if this is the main module
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  program.parseAsync(process.argv).catch(handleError);
}
