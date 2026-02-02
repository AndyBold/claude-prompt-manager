/**
 * Apply configuration to a project
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type {
  Configuration,
  ResolvedConfiguration,
  ApplyOptions,
  ApplyResult,
  ConfigurationFile,
} from "../config/types.js";
import { resolveInheritance } from "../config/resolver.js";
import { writeFilesToProject, ensureDirectory } from "../config/writer.js";
import { getConflictingFiles } from "./detector.js";
import { mergeContent } from "./merger.js";
import { ConflictDetectedError } from "../errors.js";
import { resolveSafePath } from "../config/path-safety.js";

/**
 * Apply a configuration to a target project
 */
export async function applyConfiguration(
  config: Configuration,
  options: ApplyOptions,
  getConfig: (id: string) => Promise<Configuration | undefined>
): Promise<ApplyResult> {
  const result: ApplyResult = {
    success: false,
    filesCreated: [],
    filesModified: [],
    filesSkipped: [],
    conflicts: [],
    errors: [],
  };

  try {
    // Resolve inheritance to get all files
    let resolvedConfig: ResolvedConfiguration;
    try {
      resolvedConfig = await resolveInheritance(config, getConfig);
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }

    const filesToApply = resolvedConfig.resolvedFiles;

    // Ensure target directory exists
    await ensureDirectory(options.targetPath);

    // Get list of conflicting files
    const conflictingFiles = await getConflictingFiles(
      options.targetPath,
      filesToApply.map((f) => f.path)
    );

    // Handle based on mode
    if (options.mode === "create" && conflictingFiles.length > 0) {
      if (options.noInteractive) {
        throw new ConflictDetectedError(conflictingFiles);
      }

      // Build conflict info for each conflicting file
      for (const file of filesToApply) {
        if (conflictingFiles.includes(file.path)) {
          const existingPath = resolveSafePath(options.targetPath, file.path);
          const existingContent = await readFile(existingPath, "utf-8");

          result.conflicts.push({
            path: file.path,
            existingContent,
            newContent: file.content,
          });
        }
      }

      // Return with conflicts for interactive resolution
      return result;
    }

    // Handle dry run
    if (options.dryRun) {
      for (const file of filesToApply) {
        if (conflictingFiles.includes(file.path)) {
          if (options.mode === "replace") {
            result.filesModified.push(file.path);
          } else if (options.mode === "merge") {
            result.filesModified.push(file.path);
          } else {
            result.conflicts.push({
              path: file.path,
              existingContent: "",
              newContent: file.content,
            });
          }
        } else {
          result.filesCreated.push(file.path);
        }
      }
      result.success = true;
      return result;
    }

    // Apply files based on mode
    const filesToWrite: ConfigurationFile[] = [];

    for (const file of filesToApply) {
      const isConflict = conflictingFiles.includes(file.path);

      if (!isConflict) {
        // No conflict - just add to write list
        filesToWrite.push(file);
        result.filesCreated.push(file.path);
      } else if (options.mode === "replace") {
        // Replace mode - overwrite existing
        filesToWrite.push(file);
        result.filesModified.push(file.path);
      } else if (options.mode === "merge") {
        // Merge mode - attempt to merge content
        const existingPath = resolveSafePath(options.targetPath, file.path);
        const existingContent = await readFile(existingPath, "utf-8");

        const mergeResult = mergeContent(existingContent, file.content, file.path);

        if (mergeResult.hasConflicts) {
          // Merge created conflicts - add to conflicts list
          result.conflicts.push({
            path: file.path,
            existingContent,
            newContent: file.content,
            mergedContent: mergeResult.content,
          });
        } else {
          // Merge succeeded - write merged content
          filesToWrite.push({
            ...file,
            content: mergeResult.content,
          });
          result.filesModified.push(file.path);
        }
      } else {
        // Create mode with conflict - skip (shouldn't reach here)
        result.filesSkipped.push(file.path);
      }
    }

    // Write all files
    if (filesToWrite.length > 0) {
      const writeResult = await writeFilesToProject(filesToWrite, options.targetPath);
      result.errors.push(...writeResult.errors);
    }

    result.success = result.errors.length === 0 && result.conflicts.length === 0;
  } catch (error) {
    if (error instanceof ConflictDetectedError) {
      throw error;
    }
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Apply with resolved conflicts
 */
export async function applyWithResolvedConflicts(
  resolvedConflicts: Array<{
    path: string;
    resolution: "keep" | "replace" | "merge" | "skip";
    content: string;
  }>,
  targetPath: string
): Promise<ApplyResult> {
  const result: ApplyResult = {
    success: false,
    filesCreated: [],
    filesModified: [],
    filesSkipped: [],
    conflicts: [],
    errors: [],
  };

  const filesToWrite: ConfigurationFile[] = [];

  for (const resolved of resolvedConflicts) {
    if (resolved.resolution === "skip" || resolved.resolution === "keep") {
      result.filesSkipped.push(resolved.path);
    } else {
      filesToWrite.push({
        path: resolved.path,
        content: resolved.content,
        type: "text",
      });
      result.filesModified.push(resolved.path);
    }
  }

  if (filesToWrite.length > 0) {
    const writeResult = await writeFilesToProject(filesToWrite, targetPath);
    result.errors.push(...writeResult.errors);
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Preview what would be applied (dry run)
 */
export async function previewApply(
  config: Configuration,
  targetPath: string,
  getConfig: (id: string) => Promise<Configuration | undefined>
): Promise<{
  filesToCreate: string[];
  filesToModify: string[];
  conflicts: string[];
}> {
  const result = await applyConfiguration(
    config,
    {
      configId: config.id,
      targetPath,
      mode: "create",
      dryRun: true,
    },
    getConfig
  );

  return {
    filesToCreate: result.filesCreated,
    filesToModify: result.filesModified,
    conflicts: result.conflicts.map((c) => c.path),
  };
}
