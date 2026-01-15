/**
 * Content merger for conflict resolution
 *
 * Handles merging of different file types (markdown, JSON, etc.)
 */

import type { MergeResult } from "../config/types.js";
import { getFileType } from "../constants.js";

/**
 * Merge two file contents based on file type
 */
export function mergeContent(
  existingContent: string,
  newContent: string,
  filePath: string
): MergeResult {
  const fileType = getFileType(filePath);

  switch (fileType) {
    case "markdown":
      return mergeMarkdown(existingContent, newContent);
    case "json":
      return mergeJson(existingContent, newContent);
    case "yaml":
      return mergeYaml(existingContent, newContent);
    default:
      return mergeText(existingContent, newContent);
  }
}

/**
 * Merge markdown content by sections (headers)
 */
function mergeMarkdown(existing: string, newContent: string): MergeResult {
  const existingSections = parseMarkdownSections(existing);
  const newSections = parseMarkdownSections(newContent);

  // Track conflicts
  const conflicts: string[] = [];

  // Merge sections: prefer new content for same headers
  const merged = new Map(existingSections);

  for (const [header, content] of newSections) {
    if (merged.has(header) && merged.get(header) !== content) {
      // Conflict - mark it
      conflicts.push(header || "(top-level content)");
    }
    merged.set(header, content);
  }

  // Reconstruct markdown
  const lines: string[] = [];
  for (const [header, content] of merged) {
    if (header) {
      lines.push(header);
    }
    lines.push(content);
  }

  const mergedContent = lines.join("\n").trim();

  return {
    success: conflicts.length === 0,
    content: mergedContent,
    hasConflicts: conflicts.length > 0,
    conflictMarkers: conflicts.length,
  };
}

/**
 * Parse markdown into sections by headers
 */
function parseMarkdownSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split("\n");

  let currentHeader = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.match(/^#{1,6}\s/)) {
      // New header found - save previous section
      if (currentHeader || currentContent.length > 0) {
        sections.set(currentHeader, currentContent.join("\n"));
      }
      currentHeader = line;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget the last section
  if (currentHeader || currentContent.length > 0) {
    sections.set(currentHeader, currentContent.join("\n"));
  }

  return sections;
}

/**
 * Merge JSON content with deep merge
 */
function mergeJson(existing: string, newContent: string): MergeResult {
  try {
    const existingObj = JSON.parse(existing);
    const newObj = JSON.parse(newContent);

    const merged = deepMerge(existingObj, newObj);
    const mergedContent = JSON.stringify(merged, null, 2);

    return {
      success: true,
      content: mergedContent,
      hasConflicts: false,
      conflictMarkers: 0,
    };
  } catch {
    // JSON parsing failed - return with conflict markers
    return createConflictResult(existing, newContent);
  }
}

/**
 * Merge YAML content (simplified - currently same as text)
 */
function mergeYaml(_existing: string, newContent: string): MergeResult {
  // For YAML, we do a simple replacement for now
  // A more sophisticated implementation would parse and merge
  return {
    success: true,
    content: newContent,
    hasConflicts: false,
    conflictMarkers: 0,
  };
}

/**
 * Merge plain text (creates conflict markers)
 */
function mergeText(existing: string, newContent: string): MergeResult {
  if (existing === newContent) {
    return {
      success: true,
      content: existing,
      hasConflicts: false,
      conflictMarkers: 0,
    };
  }

  return createConflictResult(existing, newContent);
}

/**
 * Create a result with conflict markers
 */
function createConflictResult(existing: string, newContent: string): MergeResult {
  const content = `<<<<<<< EXISTING
${existing}
=======
${newContent}
>>>>>>> NEW`;

  return {
    success: false,
    content,
    hasConflicts: true,
    conflictMarkers: 1,
  };
}

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key as keyof T];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key as keyof T] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      // Merge arrays - concatenate unique values
      result[key as keyof T] = [...new Set([...targetValue, ...sourceValue])] as T[keyof T];
    } else {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if content has conflict markers
 */
export function hasConflictMarkers(content: string): boolean {
  return content.includes("<<<<<<<") && content.includes("=======") && content.includes(">>>>>>>");
}

/**
 * Count conflict markers in content
 */
export function countConflictMarkers(content: string): number {
  const matches = content.match(/<<<<<<<[^\n]*\n/g);
  return matches ? matches.length : 0;
}
