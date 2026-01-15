/**
 * Configuration inheritance resolver
 *
 * Resolves inheritance chains and merges configurations with parent settings.
 */

import type { Configuration, ConfigurationFile, ResolvedConfiguration, FileType } from "./types.js";
import { InheritanceCycleError, ParentNotFoundError } from "../errors.js";

/**
 * Resolve a configuration's inheritance chain
 */
export async function resolveInheritance(
  config: Configuration,
  getConfig: (id: string) => Promise<Configuration | undefined>
): Promise<ResolvedConfiguration> {
  const inheritanceChain: string[] = [];
  const configs: Configuration[] = [];

  // Build inheritance chain (child to root)
  let current: Configuration | undefined = config;
  const seen = new Set<string>();

  while (current) {
    if (seen.has(current.id)) {
      // Cycle detected
      inheritanceChain.push(current.id);
      throw new InheritanceCycleError(inheritanceChain);
    }

    seen.add(current.id);
    inheritanceChain.push(current.id);
    configs.push(current);

    if (current.extends) {
      const parent = await getConfig(current.extends);
      if (!parent) {
        throw new ParentNotFoundError(current.id, current.extends);
      }
      current = parent;
    } else {
      current = undefined;
    }
  }

  // Merge configurations (root to child)
  const resolvedFiles = mergeConfigurationChain(configs.reverse());

  return {
    ...config,
    resolvedFiles,
    inheritanceChain,
  };
}

/**
 * Merge a chain of configurations (from root/parent to child)
 */
function mergeConfigurationChain(configs: Configuration[]): ConfigurationFile[] {
  const fileMap = new Map<string, ConfigurationFile>();

  for (const config of configs) {
    for (const file of config.fileContents) {
      const existing = fileMap.get(file.path);

      if (file.exclude) {
        // Remove file from parent
        fileMap.delete(file.path);
      } else if (file.override || !existing) {
        // Replace or add new file
        fileMap.set(file.path, { ...file });
      } else {
        // Merge with existing
        const merged = mergeFiles(existing, file);
        fileMap.set(file.path, merged);
      }
    }
  }

  return Array.from(fileMap.values());
}

/**
 * Merge two files based on their type
 */
function mergeFiles(parent: ConfigurationFile, child: ConfigurationFile): ConfigurationFile {
  const type = child.type || parent.type;

  let mergedContent: string;

  switch (type) {
    case "json":
      mergedContent = mergeJson(parent.content, child.content);
      break;
    case "yaml":
      mergedContent = mergeYaml(parent.content, child.content);
      break;
    case "markdown":
      mergedContent = mergeMarkdown(parent.content, child.content);
      break;
    default:
      // For text files, child completely replaces parent
      mergedContent = child.content;
  }

  return {
    path: child.path,
    content: mergedContent,
    type,
  };
}

/**
 * Deep merge JSON content
 */
function mergeJson(parentContent: string, childContent: string): string {
  try {
    const parent = JSON.parse(parentContent);
    const child = JSON.parse(childContent);
    const merged = deepMerge(parent, child);
    return JSON.stringify(merged, null, 2);
  } catch {
    // If parsing fails, return child content
    return childContent;
  }
}

/**
 * Merge YAML content (simplified - treats as nested objects)
 */
function mergeYaml(parentContent: string, childContent: string): string {
  // For simplicity, YAML merge is done at the text level
  // Child sections replace parent sections
  // A more sophisticated implementation would parse and merge
  return childContent || parentContent;
}

/**
 * Merge markdown content by sections (headers)
 */
function mergeMarkdown(parentContent: string, childContent: string): string {
  const parentSections = parseMarkdownSections(parentContent);
  const childSections = parseMarkdownSections(childContent);

  // Child sections override parent sections with same header
  const mergedSections = new Map(parentSections);

  for (const [header, content] of childSections) {
    mergedSections.set(header, content);
  }

  // Reconstruct markdown
  const lines: string[] = [];

  for (const [header, content] of mergedSections) {
    if (header) {
      lines.push(header);
    }
    lines.push(content);
  }

  return lines.join("\n").trim();
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
      // New header found
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
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key as keyof T];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key as keyof T] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      // Merge arrays by concatenating unique values
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
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Get the file type for merge behavior
 */
export function getFileTypeForMerge(filename: string): FileType {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();

  switch (ext) {
    case ".json":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".md":
    case ".markdown":
      return "markdown";
    default:
      return "text";
  }
}
