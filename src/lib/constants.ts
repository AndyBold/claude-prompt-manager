import { homedir, platform } from "os";
import { join } from "path";

/**
 * Platform-specific configuration directory paths
 */
function getConfigDir(): string {
  const plat = platform();
  if (plat === "win32") {
    return process.env.APPDATA || join(homedir(), "AppData", "Roaming");
  }
  // macOS and Linux follow XDG Base Directory Specification
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
}

/**
 * Application name used for directory naming
 */
export const APP_NAME = "claude-prompt-manager";

/**
 * CLI command name
 */
export const CLI_NAME = "cpm";

/**
 * Base configuration directory
 */
export const CONFIG_DIR = join(getConfigDir(), APP_NAME);

/**
 * User's configuration library path
 * Can be overridden with CPM_LIBRARY_PATH environment variable
 */
export const LIBRARY_PATH = process.env.CPM_LIBRARY_PATH || join(CONFIG_DIR, "library");

/**
 * Global settings file path
 */
export const SETTINGS_PATH = join(CONFIG_DIR, "settings.yaml");

/**
 * Configuration metadata filename
 */
export const CONFIG_FILENAME = "config.yaml";

/**
 * Default Claude Code configuration filename
 */
export const CLAUDE_MD_FILENAME = "CLAUDE.md";

/**
 * Claude Code settings directory
 */
export const CLAUDE_DIR = ".claude";

/**
 * Claude Code settings file
 */
export const CLAUDE_SETTINGS_FILENAME = "settings.json";

/**
 * Valid project types
 */
export const PROJECT_TYPES = ["web", "api", "cli", "library", "mobile", "fullstack"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/**
 * Valid testing approaches
 */
export const TESTING_APPROACHES = ["tdd", "bdd", "unit", "integration", "e2e", "none"] as const;
export type TestingApproach = (typeof TESTING_APPROACHES)[number];

/**
 * Exit codes per CLI contract
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_FOUND: 2,
  VALIDATION_ERROR: 3,
  CONFLICT: 4,
  PERMISSION_DENIED: 5,
} as const;

/**
 * Environment variable names
 */
export const ENV_VARS = {
  LIBRARY_PATH: "CPM_LIBRARY_PATH",
  NO_COLOR: "CPM_NO_COLOR",
  VERBOSE: "CPM_VERBOSE",
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  VERSION: "1.0.0",
  TESTING_APPROACH: "unit" as TestingApproach,
} as const;

/**
 * File type mapping by extension
 */
export const FILE_TYPE_MAP: Record<string, "markdown" | "json" | "yaml" | "text"> = {
  ".md": "markdown",
  ".markdown": "markdown",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".txt": "text",
};

/**
 * Get file type from extension
 */
export function getFileType(filename: string): "markdown" | "json" | "yaml" | "text" {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return FILE_TYPE_MAP[ext] || "text";
}
