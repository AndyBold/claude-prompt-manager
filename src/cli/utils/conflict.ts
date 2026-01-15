/**
 * Conflict resolution UI for CLI
 */

import type { ConflictInfo } from "../../lib/config/types.js";
import { generateDiff, formatDiffForDisplay } from "../../lib/apply/differ.js";
import { mergeContent } from "../../lib/apply/merger.js";
import { style, blankLine } from "./output.js";
import { select, type Choice } from "./prompts.js";

/**
 * Conflict resolution choice
 */
export type ConflictResolution = "keep" | "replace" | "merge" | "skip";

/**
 * Result of conflict resolution
 */
export interface ResolvedConflict {
  path: string;
  resolution: ConflictResolution;
  content: string;
}

/**
 * Display a conflict and prompt for resolution
 */
export async function resolveConflict(conflict: ConflictInfo): Promise<ResolvedConflict> {
  // Generate diff
  const diff = generateDiff(conflict.existingContent, conflict.newContent, conflict.path);

  // Display header
  console.log(style.warning(`Conflict: ${conflict.path}`));
  blankLine();

  // Show diff
  console.log(formatDiffForDisplay(diff));
  blankLine();

  // Show summary
  console.log(style.dim(`Changes: +${diff.additions} additions, -${diff.deletions} deletions`));
  blankLine();

  // Prompt for resolution
  const choices: Choice<ConflictResolution>[] = [
    {
      label: "Keep existing",
      value: "keep",
      key: "k",
    },
    {
      label: "Replace with new",
      value: "replace",
      key: "r",
    },
    {
      label: "Merge (automatic)",
      value: "merge",
      key: "m",
    },
    {
      label: "Skip this file",
      value: "skip",
      key: "s",
    },
  ];

  const resolution = await select("How do you want to resolve this conflict?", choices);

  // Determine final content
  let content: string;

  switch (resolution) {
    case "keep":
      content = conflict.existingContent;
      break;
    case "replace":
      content = conflict.newContent;
      break;
    case "merge": {
      const mergeResult = mergeContent(
        conflict.existingContent,
        conflict.newContent,
        conflict.path
      );
      content = mergeResult.content;

      if (mergeResult.hasConflicts) {
        console.log(
          style.warning(
            `Merge created ${mergeResult.conflictMarkers} conflict marker(s). Please resolve manually.`
          )
        );
      } else {
        console.log(style.success("Merge completed successfully."));
      }
      break;
    }
    case "skip":
    default:
      content = conflict.existingContent;
      break;
  }

  return {
    path: conflict.path,
    resolution,
    content,
  };
}

/**
 * Resolve multiple conflicts interactively
 */
export async function resolveConflicts(conflicts: ConflictInfo[]): Promise<ResolvedConflict[]> {
  const resolved: ResolvedConflict[] = [];

  for (let i = 0; i < conflicts.length; i++) {
    console.log(style.bold(`\nConflict ${i + 1} of ${conflicts.length}`));
    const result = await resolveConflict(conflicts[i]);
    resolved.push(result);
  }

  return resolved;
}

/**
 * Display a summary of conflict resolutions
 */
export function displayResolutionSummary(resolved: ResolvedConflict[]): void {
  blankLine();
  console.log(style.bold("Resolution Summary:"));

  const kept = resolved.filter((r) => r.resolution === "keep");
  const replaced = resolved.filter((r) => r.resolution === "replace");
  const merged = resolved.filter((r) => r.resolution === "merge");
  const skipped = resolved.filter((r) => r.resolution === "skip");

  if (kept.length > 0) {
    console.log(style.dim(`  Kept existing: ${kept.length}`));
  }
  if (replaced.length > 0) {
    console.log(style.green(`  Replaced: ${replaced.length}`));
  }
  if (merged.length > 0) {
    console.log(style.yellow(`  Merged: ${merged.length}`));
  }
  if (skipped.length > 0) {
    console.log(style.gray(`  Skipped: ${skipped.length}`));
  }
}
