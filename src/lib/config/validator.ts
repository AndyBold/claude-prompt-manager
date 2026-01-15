/**
 * Configuration validator - validates configuration structure and metadata
 */

import { stat } from "fs/promises";
import { join } from "path";
import type { Configuration, ConfigurationMetadata, ValidationResult } from "./types.js";
import { PROJECT_TYPES, TESTING_APPROACHES } from "../constants.js";

/**
 * Validate a configuration ID format
 */
export function validateConfigId(id: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!id) {
    errors.push("Configuration ID is required");
    return { valid: false, errors, warnings };
  }

  // Must be lowercase alphanumeric with hyphens
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(id)) {
    errors.push(
      "Configuration ID must be lowercase alphanumeric with hyphens, cannot start or end with hyphen"
    );
  }

  // Reasonable length
  if (id.length > 100) {
    errors.push("Configuration ID must be 100 characters or less");
  }

  // No consecutive hyphens
  if (id.includes("--")) {
    warnings.push("Configuration ID contains consecutive hyphens");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate configuration metadata
 */
export function validateMetadata(metadata: ConfigurationMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.name || metadata.name.trim() === "") {
    errors.push("Name is required");
  } else if (metadata.name.length > 100) {
    errors.push("Name must be 100 characters or less");
  }

  if (!metadata.description || metadata.description.trim() === "") {
    errors.push("Description is required");
  } else if (metadata.description.length > 500) {
    errors.push("Description must be 500 characters or less");
  }

  // Version must follow semver
  if (!metadata.version) {
    errors.push("Version is required");
  } else if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
    errors.push("Version must follow semantic versioning (e.g., 1.0.0)");
  }

  // Project types
  if (!metadata.projectTypes || metadata.projectTypes.length === 0) {
    errors.push("At least one project type is required");
  } else {
    const invalidTypes = metadata.projectTypes.filter(
      (t) => !PROJECT_TYPES.includes(t as (typeof PROJECT_TYPES)[number])
    );
    if (invalidTypes.length > 0) {
      errors.push(`Invalid project types: ${invalidTypes.join(", ")}. Valid: ${PROJECT_TYPES.join(", ")}`);
    }
  }

  // Languages
  if (!metadata.languages || metadata.languages.length === 0) {
    errors.push("At least one language is required");
  }

  // Testing approach (optional but must be valid if provided)
  if (
    metadata.testingApproach &&
    !TESTING_APPROACHES.includes(metadata.testingApproach as (typeof TESTING_APPROACHES)[number])
  ) {
    errors.push(
      `Invalid testing approach: ${metadata.testingApproach}. Valid: ${TESTING_APPROACHES.join(", ")}`
    );
  }

  // Files array
  if (!metadata.files || metadata.files.length === 0) {
    warnings.push("Configuration has no files defined");
  }

  // Dates
  if (metadata.created && isNaN(metadata.created.getTime())) {
    errors.push("Invalid created date");
  }

  if (metadata.updated && isNaN(metadata.updated.getTime())) {
    errors.push("Invalid updated date");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a full configuration
 */
export function validateConfiguration(config: Configuration): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate ID
  const idResult = validateConfigId(config.id);
  errors.push(...idResult.errors);
  warnings.push(...idResult.warnings);

  // Validate metadata
  const metaResult = validateMetadata(config);
  errors.push(...metaResult.errors);
  warnings.push(...metaResult.warnings);

  // Validate file paths
  for (const filePath of config.files) {
    // Must be relative (no leading /)
    if (filePath.startsWith("/")) {
      errors.push(`File path must be relative: ${filePath}`);
    }

    // Must not traverse up
    if (filePath.includes("..")) {
      errors.push(`File path cannot traverse up: ${filePath}`);
    }
  }

  // Check file contents match files array
  if (config.fileContents) {
    const contentPaths = new Set(config.fileContents.map((f) => f.path));
    const declaredPaths = new Set(config.files);

    for (const path of config.files) {
      if (!contentPaths.has(path)) {
        warnings.push(`Declared file not loaded: ${path}`);
      }
    }

    for (const path of contentPaths) {
      if (!declaredPaths.has(path)) {
        warnings.push(`Loaded file not declared in metadata: ${path}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate configuration files exist on disk
 */
export async function validateFilesExist(
  configPath: string,
  files: string[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const filePath of files) {
    const fullPath = join(configPath, filePath);
    try {
      const stats = await stat(fullPath);
      if (!stats.isFile()) {
        errors.push(`Not a file: ${filePath}`);
      }
    } catch {
      errors.push(`File not found: ${filePath}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate inheritance chain (no cycles)
 */
export function validateInheritanceChain(
  configId: string,
  getParentId: (id: string) => string | undefined,
  maxDepth: number = 10
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const chain: string[] = [];

  let currentId: string | undefined = configId;

  while (currentId) {
    if (seen.has(currentId)) {
      chain.push(currentId);
      errors.push(`Circular inheritance detected: ${chain.join(" → ")}`);
      break;
    }

    seen.add(currentId);
    chain.push(currentId);

    if (chain.length > maxDepth) {
      warnings.push(`Inheritance chain exceeds ${maxDepth} levels`);
      break;
    }

    currentId = getParentId(currentId);
  }

  return { valid: errors.length === 0, errors, warnings };
}
