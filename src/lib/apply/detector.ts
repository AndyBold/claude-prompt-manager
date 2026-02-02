/**
 * Configuration detector - checks for existing Claude Code configuration
 */

import { stat, readFile } from "fs/promises";
import { join } from "path";
import { CLAUDE_MD_FILENAME, CLAUDE_DIR } from "../constants.js";
import { resolveSafePath } from "../config/path-safety.js";

/**
 * Detection result for a project
 */
export interface DetectionResult {
  /** Whether any Claude Code configuration exists */
  hasConfiguration: boolean;
  /** Whether CLAUDE.md exists */
  hasClaudeMd: boolean;
  /** Whether .claude directory exists */
  hasClaudeDir: boolean;
  /** List of existing Claude-related files */
  existingFiles: string[];
  /** Content of existing CLAUDE.md (if it exists) */
  claudeMdContent?: string;
}

/**
 * Detect existing Claude Code configuration in a directory
 */
export async function detectExistingConfig(targetPath: string): Promise<DetectionResult> {
  const result: DetectionResult = {
    hasConfiguration: false,
    hasClaudeMd: false,
    hasClaudeDir: false,
    existingFiles: [],
  };

  // Check for CLAUDE.md
  const claudeMdPath = join(targetPath, CLAUDE_MD_FILENAME);
  try {
    const stats = await stat(claudeMdPath);
    if (stats.isFile()) {
      result.hasClaudeMd = true;
      result.hasConfiguration = true;
      result.existingFiles.push(CLAUDE_MD_FILENAME);
      result.claudeMdContent = await readFile(claudeMdPath, "utf-8");
    }
  } catch {
    // File doesn't exist
  }

  // Check for .claude directory
  const claudeDirPath = join(targetPath, CLAUDE_DIR);
  try {
    const stats = await stat(claudeDirPath);
    if (stats.isDirectory()) {
      result.hasClaudeDir = true;
      result.hasConfiguration = true;

      // Check for common files in .claude directory
      const commonFiles = ["settings.json", "commands/"];
      for (const file of commonFiles) {
        const filePath = join(claudeDirPath, file);
        try {
          await stat(filePath);
          result.existingFiles.push(join(CLAUDE_DIR, file));
        } catch {
          // File doesn't exist
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return result;
}

/**
 * Check if a specific file exists in target path
 */
export async function fileExists(targetPath: string, relativePath: string): Promise<boolean> {
  try {
    const fullPath = resolveSafePath(targetPath, relativePath);
    const stats = await stat(fullPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get list of files that would conflict
 */
export async function getConflictingFiles(
  targetPath: string,
  newFiles: string[]
): Promise<string[]> {
  const conflicts: string[] = [];

  for (const file of newFiles) {
    if (await fileExists(targetPath, file)) {
      conflicts.push(file);
    }
  }

  return conflicts;
}
