/**
 * Core type definitions for Claude Prompt Manager
 *
 * Based on data-model.md specification
 */

import type { ProjectType, TestingApproach } from "../constants.js";

/**
 * File type for merge behavior determination
 */
export type FileType = "markdown" | "json" | "yaml" | "text";

/**
 * A single file within a configuration
 */
export interface ConfigurationFile {
  /** Relative path within configuration (no leading /) */
  path: string;
  /** File content */
  content: string;
  /** File type for merge behavior */
  type: FileType;
  /** If true, replaces parent file entirely (inheritance) */
  override?: boolean;
  /** If true, excludes parent file (inheritance) */
  exclude?: boolean;
}

/**
 * Configuration metadata stored in config.yaml
 */
export interface ConfigurationMetadata {
  /** Unique identifier (directory name) */
  id: string;
  /** Display name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Parent configuration ID (optional, for inheritance) */
  extends?: string;
  /** Applicable project types */
  projectTypes: ProjectType[];
  /** Supported programming languages */
  languages: string[];
  /** Additional searchable tags */
  tags: string[];
  /** Testing approach recommendation */
  testingApproach?: TestingApproach;
  /** Creation timestamp */
  created: Date;
  /** Last update timestamp */
  updated: Date;
  /** List of file paths in configuration */
  files: string[];
}

/**
 * A complete configuration with metadata and content files
 */
export interface Configuration extends ConfigurationMetadata {
  /** Configuration content files */
  fileContents: ConfigurationFile[];
  /** Whether this is a bundled (read-only) configuration */
  bundled?: boolean;
  /** Source path of configuration directory */
  sourcePath?: string;
}

/**
 * A configuration with inheritance fully resolved
 */
export interface ResolvedConfiguration extends Configuration {
  /** Merged files from inheritance chain */
  resolvedFiles: ConfigurationFile[];
  /** Inheritance chain [child, parent, grandparent, ...] */
  inheritanceChain: string[];
}

/**
 * Library containing all configurations
 */
export interface Library {
  /** Library root path */
  path: string;
  /** User configurations */
  configurations: Configuration[];
  /** Path to bundled configurations */
  bundledPath: string;
  /** Bundled configurations */
  bundledConfigurations: Configuration[];
}

/**
 * Search criteria for filtering configurations
 */
export interface SearchCriteria {
  /** Free-text search (matches name, description, tags) */
  query?: string;
  /** Filter by project types */
  projectTypes?: ProjectType[];
  /** Filter by languages */
  languages?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Show only bundled configurations */
  bundledOnly?: boolean;
  /** Show only user configurations */
  userOnly?: boolean;
}

/**
 * Apply mode for configuration application
 */
export type ApplyMode = "create" | "replace" | "merge";

/**
 * Options for applying a configuration to a project
 */
export interface ApplyOptions {
  /** Configuration ID to apply */
  configId: string;
  /** Target project directory */
  targetPath: string;
  /** How to handle existing files */
  mode: ApplyMode;
  /** Preview changes without writing */
  dryRun?: boolean;
  /** Fail on conflicts instead of prompting */
  noInteractive?: boolean;
}

/**
 * Information about a file conflict
 */
export interface ConflictInfo {
  /** File path relative to target */
  path: string;
  /** Existing file content */
  existingContent: string;
  /** New content from configuration */
  newContent: string;
  /** How the conflict was resolved */
  resolution?: "keep" | "replace" | "merge";
  /** Merged content (if resolution is 'merge') */
  mergedContent?: string;
}

/**
 * Result of applying a configuration
 */
export interface ApplyResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Files that were created */
  filesCreated: string[];
  /** Files that were modified */
  filesModified: string[];
  /** Files that were skipped */
  filesSkipped: string[];
  /** Conflicts encountered */
  conflicts: ConflictInfo[];
  /** Error messages */
  errors: string[];
}

/**
 * Result of merging file content
 */
export interface MergeResult {
  /** Whether merge succeeded without conflicts */
  success: boolean;
  /** Merged content */
  content: string;
  /** Whether manual resolution is needed */
  hasConflicts: boolean;
  /** Number of conflict markers in content */
  conflictMarkers: number;
}

/**
 * Validation result for a configuration
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Validation warning messages */
  warnings: string[];
}

/**
 * Options for creating a new configuration
 */
export interface CreateOptions {
  /** Configuration ID */
  id: string;
  /** Display name */
  name?: string;
  /** Description */
  description?: string;
  /** Parent configuration to extend */
  extends?: string;
  /** Project types */
  projectTypes?: ProjectType[];
  /** Languages */
  languages?: string[];
  /** Tags */
  tags?: string[];
  /** Testing approach */
  testingApproach?: TestingApproach;
  /** Create from existing project path */
  fromProject?: string;
  /** Interactive mode */
  interactive?: boolean;
}

/**
 * Global CLI options available on all commands
 */
export interface GlobalOptions {
  /** Override default library path */
  library?: string;
  /** Enable verbose output */
  verbose?: boolean;
  /** Output in JSON format */
  json?: boolean;
}
