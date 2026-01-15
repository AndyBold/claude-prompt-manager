/**
 * Diff generator for conflict resolution
 *
 * Uses the diff library to generate unified diffs between existing and new content.
 */

import { createTwoFilesPatch, structuredPatch } from "diff";

/**
 * Diff result for a file
 */
export interface DiffResult {
  /** Whether files are different */
  hasDifferences: boolean;
  /** Unified diff string for display */
  unifiedDiff: string;
  /** Number of additions */
  additions: number;
  /** Number of deletions */
  deletions: number;
  /** Structured hunks for programmatic access */
  hunks: DiffHunk[];
}

/**
 * A single diff hunk
 */
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * Generate a diff between existing and new content
 */
export function generateDiff(
  existingContent: string,
  newContent: string,
  filePath: string
): DiffResult {
  // Generate unified diff
  const unifiedDiff = createTwoFilesPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    existingContent,
    newContent,
    "existing",
    "new"
  );

  // Generate structured patch
  const patch = structuredPatch(`a/${filePath}`, `b/${filePath}`, existingContent, newContent);

  // Count additions and deletions
  let additions = 0;
  let deletions = 0;

  const hunks: DiffHunk[] = patch.hunks.map((hunk) => {
    const lines: string[] = [];

    for (const line of hunk.lines) {
      lines.push(line);
      if (line.startsWith("+")) {
        additions++;
      } else if (line.startsWith("-")) {
        deletions++;
      }
    }

    return {
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      lines,
    };
  });

  return {
    hasDifferences: hunks.length > 0,
    unifiedDiff,
    additions,
    deletions,
    hunks,
  };
}

/**
 * Format a diff for display with colors (ANSI)
 */
export function formatDiffForDisplay(diff: DiffResult, colored: boolean = true): string {
  if (!diff.hasDifferences) {
    return "No differences";
  }

  const lines = diff.unifiedDiff.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (colored) {
      if (line.startsWith("+++") || line.startsWith("---")) {
        result.push(`\x1b[1m${line}\x1b[0m`); // Bold
      } else if (line.startsWith("+")) {
        result.push(`\x1b[32m${line}\x1b[0m`); // Green
      } else if (line.startsWith("-")) {
        result.push(`\x1b[31m${line}\x1b[0m`); // Red
      } else if (line.startsWith("@@")) {
        result.push(`\x1b[36m${line}\x1b[0m`); // Cyan
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Generate a summary of differences
 */
export function getDiffSummary(diff: DiffResult): string {
  if (!diff.hasDifferences) {
    return "No changes";
  }

  const parts: string[] = [];

  if (diff.additions > 0) {
    parts.push(`+${diff.additions}`);
  }

  if (diff.deletions > 0) {
    parts.push(`-${diff.deletions}`);
  }

  return parts.join(", ");
}
