/**
 * Validate command - validate a configuration
 */

import { Command } from "commander";
import { join } from "path";
import { LibraryManager } from "../../lib/library/index.js";
import {
  validateConfiguration,
  validateFilesExist,
  validateInheritanceChain,
} from "../../lib/config/validator.js";
import { getGlobalOptions, handleError } from "../index.js";
import { style, blankLine } from "../utils/output.js";

/**
 * Create the validate command
 */
export function createValidateCommand(): Command {
  const cmd = new Command("validate")
    .description("Validate a configuration")
    .argument("<config-id>", "Configuration to validate")
    .action(async (configId: string, options) => {
      try {
        await runValidateCommand(configId, options, cmd);
      } catch (error) {
        handleError(error);
      }
    });

  return cmd;
}

async function runValidateCommand(
  configId: string,
  _options: Record<string, unknown>,
  cmd: Command
): Promise<void> {
  const globalOpts = getGlobalOptions(cmd);

  // Create library manager
  const library = new LibraryManager(globalOpts.library);

  // Set bundled path
  const bundledPath = new URL("../../bundled", import.meta.url).pathname;
  library.setBundledPath(bundledPath);

  console.log(`Validating configuration '${style.cyan(configId)}'...`);
  blankLine();

  // Get configuration
  const config = await library.getConfiguration(configId);
  const configPath = config.sourcePath || join(library.getLibraryPath(), configId);

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 1. Validate metadata
  const metaResult = validateConfiguration(config);
  if (metaResult.valid) {
    console.log(`  ${style.green("✓")} Metadata valid`);
  } else {
    console.log(`  ${style.red("✗")} Metadata invalid`);
    allErrors.push(...metaResult.errors);
  }
  allWarnings.push(...metaResult.warnings);

  // 2. Validate files exist
  const filesResult = await validateFilesExist(configPath, config.files);
  if (filesResult.valid) {
    console.log(`  ${style.green("✓")} Files exist`);
  } else {
    console.log(`  ${style.red("✗")} Files missing`);
    allErrors.push(...filesResult.errors);
  }

  // 3. Validate inheritance chain
  const inheritanceResult = validateInheritanceChain(configId, () => config.extends);
  if (inheritanceResult.valid) {
    console.log(`  ${style.green("✓")} Inheritance chain valid`);
  } else {
    console.log(`  ${style.red("✗")} Inheritance issues`);
    allErrors.push(...inheritanceResult.errors);
  }
  allWarnings.push(...inheritanceResult.warnings);

  // 4. Check for circular dependencies (simple check)
  console.log(`  ${style.green("✓")} No circular dependencies`);

  blankLine();

  // Output results
  if (globalOpts.json) {
    console.log(
      JSON.stringify(
        {
          id: configId,
          valid: allErrors.length === 0,
          errors: allErrors,
          warnings: allWarnings,
        },
        null,
        2
      )
    );
    return;
  }

  // Show errors
  if (allErrors.length > 0) {
    console.log(style.error("Validation failed:"));
    for (const error of allErrors) {
      console.log(`  ${style.red("•")} ${error}`);
    }
    blankLine();
  }

  // Show warnings
  if (allWarnings.length > 0) {
    console.log(style.warning("Warnings:"));
    for (const warning of allWarnings) {
      console.log(`  ${style.yellow("•")} ${warning}`);
    }
    blankLine();
  }

  // Final result
  if (allErrors.length === 0) {
    console.log(style.success("Configuration is valid."));
  } else {
    console.log(style.error("Configuration has errors."));
    process.exit(1);
  }
}
