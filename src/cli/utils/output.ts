/**
 * CLI output utilities for formatting and display
 */

import type { Configuration } from "../../lib/config/types.js";
import { ENV_VARS } from "../../lib/constants.js";

/**
 * Check if colors should be disabled
 */
export function isNoColor(): boolean {
  return !!process.env[ENV_VARS.NO_COLOR] || !!process.env.NO_COLOR;
}

/**
 * ANSI color codes
 */
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

/**
 * Apply color if colors are enabled
 */
function color(text: string, colorCode: string): string {
  if (isNoColor()) return text;
  return `${colorCode}${text}${colors.reset}`;
}

/**
 * Color helper functions
 */
export const style = {
  bold: (text: string) => color(text, colors.bold),
  dim: (text: string) => color(text, colors.dim),
  green: (text: string) => color(text, colors.green),
  yellow: (text: string) => color(text, colors.yellow),
  blue: (text: string) => color(text, colors.blue),
  cyan: (text: string) => color(text, colors.cyan),
  red: (text: string) => color(text, colors.red),
  gray: (text: string) => color(text, colors.gray),
  success: (text: string) => color(`✓ ${text}`, colors.green),
  error: (text: string) => color(`✗ ${text}`, colors.red),
  warning: (text: string) => color(`⚠ ${text}`, colors.yellow),
  info: (text: string) => color(`ℹ ${text}`, colors.blue),
};

/**
 * Format a configuration for list display
 */
export function formatConfigListItem(config: Configuration, maxNameLength: number = 20): string {
  const name = config.name.padEnd(maxNameLength);
  const description = config.description;
  return `  ${style.cyan(name)} ${description}`;
}

/**
 * Format configuration list header
 */
export function formatListHeader(title: string): string {
  return `${style.bold(title)}\n`;
}

/**
 * Format configuration details
 */
export function formatConfigDetails(config: Configuration): string {
  const lines: string[] = [
    `${style.bold("Configuration:")} ${config.name}`,
    "",
    `  ${style.dim("Description:")}  ${config.description}`,
    `  ${style.dim("Version:")}      ${config.version}`,
  ];

  if (config.extends) {
    lines.push(`  ${style.dim("Extends:")}      ${config.extends}`);
  }

  lines.push(
    `  ${style.dim("Project Types:")} ${config.projectTypes.join(", ")}`,
    `  ${style.dim("Languages:")}    ${config.languages.join(", ")}`
  );

  if (config.tags.length > 0) {
    lines.push(`  ${style.dim("Tags:")}         ${config.tags.join(", ")}`);
  }

  if (config.testingApproach) {
    lines.push(`  ${style.dim("Testing:")}      ${config.testingApproach}`);
  }

  lines.push(
    "",
    `  ${style.dim("Files")} (${config.files.length}):`,
    ...config.files.map((f) => `    - ${f}`),
    "",
    `  ${style.dim("Created:")} ${formatDate(config.created)}`,
    `  ${style.dim("Updated:")} ${formatDate(config.updated)}`
  );

  return lines.join("\n");
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format apply result summary
 */
export function formatApplyResult(
  created: number,
  modified: number,
  skipped: number,
  conflicts: number
): string {
  const lines: string[] = [];

  if (created > 0) lines.push(`  ${created} file${created === 1 ? "" : "s"} created`);
  if (modified > 0) lines.push(`  ${modified} file${modified === 1 ? "" : "s"} modified`);
  if (skipped > 0) lines.push(`  ${skipped} file${skipped === 1 ? "" : "s"} skipped`);
  if (conflicts > 0) lines.push(`  ${conflicts} conflict${conflicts === 1 ? "" : "s"}`);

  return lines.join("\n");
}

/**
 * Format file operation message
 */
export function formatFileOp(operation: "create" | "modify" | "skip", path: string): string {
  const ops = {
    create: style.green("Creating:"),
    modify: style.yellow("Modifying:"),
    skip: style.gray("Skipping:"),
  };
  return `  ${ops[operation]} ${path}`;
}

/**
 * Output JSON if json mode is enabled, otherwise format text
 */
export function outputResult<T>(data: T, jsonMode: boolean, formatter: (data: T) => string): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(formatter(data));
  }
}

/**
 * Print a blank line
 */
export function blankLine(): void {
  console.log();
}

/**
 * Print next steps after an operation
 */
export function printNextSteps(steps: string[]): void {
  console.log(style.dim("\nNext steps:"));
  steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
  });
}

/**
 * Format search result with highlighted matches
 */
export function formatSearchResult(
  config: Configuration,
  query: string,
  maxNameLength: number = 20
): string {
  const name = config.name.padEnd(maxNameLength);
  const description = highlightMatches(config.description, query);
  const tags =
    config.tags.length > 0
      ? `\n${"".padEnd(maxNameLength + 2)}${style.dim("Tags:")} ${highlightMatches(config.tags.join(", "), query)}`
      : "";

  return `  ${style.cyan(name)} ${description}${tags}`;
}

/**
 * Highlight query matches in text (case-insensitive)
 */
function highlightMatches(text: string, query: string): string {
  if (!query || isNoColor()) return text;

  const terms = query.toLowerCase().split(/\s+/);
  let result = text;

  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    result = result.replace(regex, style.yellow("$1"));
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
