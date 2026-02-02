/**
 * Configuration writer - saves configurations to filesystem
 */

import { writeFile, mkdir, rm } from "fs/promises";
import { join, dirname } from "path";
import { stringify as stringifyYaml } from "yaml";
import type { Configuration, ConfigurationMetadata, ConfigurationFile } from "./types.js";
import { CONFIG_FILENAME } from "../constants.js";
import { PermissionDeniedError } from "../errors.js";
import { resolveSafePath } from "./path-safety.js";

/**
 * Write a configuration to a directory
 */
export async function writeConfiguration(config: Configuration, targetPath: string): Promise<void> {
  // Create config directory
  await ensureDirectory(targetPath);

  // Write metadata
  await writeMetadata(config, targetPath);

  // Write files
  await writeConfigFiles(config.fileContents, targetPath);
}

/**
 * Write configuration metadata to config.yaml
 */
export async function writeMetadata(
  metadata: ConfigurationMetadata,
  configPath: string
): Promise<void> {
  const metadataPath = join(configPath, CONFIG_FILENAME);

  const yamlContent: Record<string, unknown> = {
    name: metadata.name,
    description: metadata.description,
    version: metadata.version,
  };

  if (metadata.extends) {
    yamlContent.extends = metadata.extends;
  }

  yamlContent.projectTypes = metadata.projectTypes;
  yamlContent.languages = metadata.languages;

  if (metadata.tags.length > 0) {
    yamlContent.tags = metadata.tags;
  }

  if (metadata.testingApproach) {
    yamlContent.testingApproach = metadata.testingApproach;
  }

  yamlContent.created = metadata.created.toISOString();
  yamlContent.updated = metadata.updated.toISOString();
  yamlContent.files = metadata.files;

  const yaml = stringifyYaml(yamlContent, { lineWidth: 0 });
  await safeWriteFile(metadataPath, yaml);
}

/**
 * Write configuration files to disk
 */
export async function writeConfigFiles(
  files: ConfigurationFile[],
  targetPath: string
): Promise<void> {
  for (const file of files) {
    const filePath = resolveSafePath(targetPath, file.path);
    await ensureDirectory(dirname(filePath));
    await safeWriteFile(filePath, file.content);
  }
}

/**
 * Write files to a target project directory
 */
export async function writeFilesToProject(
  files: ConfigurationFile[],
  projectPath: string
): Promise<{ created: string[]; errors: string[] }> {
  const created: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const filePath = resolveSafePath(projectPath, file.path);
      await ensureDirectory(dirname(filePath));
      await safeWriteFile(filePath, file.content);
      created.push(file.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to write ${file.path}: ${message}`);
    }
  }

  return { created, errors };
}

/**
 * Ensure a directory exists
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      throw new PermissionDeniedError(dirPath);
    }
    throw error;
  }
}

/**
 * Safely write a file with permission error handling
 */
async function safeWriteFile(filePath: string, content: string): Promise<void> {
  try {
    await writeFile(filePath, content, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      throw new PermissionDeniedError(filePath);
    }
    throw error;
  }
}

/**
 * Remove a configuration directory
 */
export async function removeConfiguration(configPath: string): Promise<void> {
  try {
    await rm(configPath, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      throw new PermissionDeniedError(configPath);
    }
    throw error;
  }
}

/**
 * Update timestamps on configuration metadata
 */
export function updateTimestamps(metadata: ConfigurationMetadata): ConfigurationMetadata {
  return {
    ...metadata,
    updated: new Date(),
  };
}

/**
 * Bump version according to semver type
 */
export function bumpVersion(currentVersion: string, type: "major" | "minor" | "patch"): string {
  const parts = currentVersion.split(".").map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    // If invalid, return 1.0.0
    return "1.0.0";
  }

  switch (type) {
    case "major":
      return `${parts[0] + 1}.0.0`;
    case "minor":
      return `${parts[0]}.${parts[1] + 1}.0`;
    case "patch":
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return currentVersion;
  }
}
