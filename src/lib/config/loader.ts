/**
 * Configuration loader - reads configurations from filesystem
 */

import { readFile, readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { parse as parseYaml } from "yaml";
import type { Configuration, ConfigurationFile, ConfigurationMetadata } from "./types.js";
import type { ProjectType, TestingApproach } from "../constants.js";
import { CONFIG_FILENAME, getFileType } from "../constants.js";
import { ConfigNotFoundError, InvalidConfigError, FileNotFoundError } from "../errors.js";
import { resolveSafePath } from "./path-safety.js";

/**
 * Load a configuration from a directory
 */
export async function loadConfiguration(configPath: string): Promise<Configuration> {
  const configId = basename(configPath);

  // Check if directory exists
  try {
    const stats = await stat(configPath);
    if (!stats.isDirectory()) {
      throw new ConfigNotFoundError(configId);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigNotFoundError(configId);
    }
    throw error;
  }

  // Load metadata
  const metadataPath = join(configPath, CONFIG_FILENAME);
  const metadata = await loadMetadata(metadataPath, configId);

  // Load file contents
  const fileContents = await loadConfigFiles(configPath, metadata.files, configId);

  return {
    ...metadata,
    id: configId,
    fileContents,
    sourcePath: configPath,
  };
}

/**
 * Load configuration metadata from config.yaml
 */
export async function loadMetadata(
  metadataPath: string,
  configId: string
): Promise<ConfigurationMetadata> {
  let rawContent: string;

  try {
    rawContent = await readFile(metadataPath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new InvalidConfigError(configId, `Missing ${CONFIG_FILENAME}`);
    }
    throw error;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parseYaml(rawContent) as Record<string, unknown>;
  } catch {
    throw new InvalidConfigError(configId, `Invalid YAML in ${CONFIG_FILENAME}`);
  }

  // Transform dates from strings
  const created = parsed.created ? new Date(parsed.created as string) : new Date();
  const updated = parsed.updated ? new Date(parsed.updated as string) : new Date();

  return {
    id: configId,
    name: (parsed.name as string) || configId,
    description: (parsed.description as string) || "",
    version: (parsed.version as string) || "1.0.0",
    extends: parsed.extends as string | undefined,
    projectTypes: (parsed.projectTypes as ProjectType[]) || [],
    languages: (parsed.languages as string[]) || [],
    tags: (parsed.tags as string[]) || [],
    testingApproach: parsed.testingApproach as TestingApproach | undefined,
    created,
    updated,
    files: (parsed.files as string[]) || [],
  };
}

/**
 * Load configuration file contents
 */
async function loadConfigFiles(
  configPath: string,
  filePaths: string[],
  configId: string
): Promise<ConfigurationFile[]> {
  const files: ConfigurationFile[] = [];

  for (const filePath of filePaths) {
    const fullPath = resolveSafePath(configPath, filePath);

    try {
      const content = await readFile(fullPath, "utf-8");
      files.push({
        path: filePath,
        content,
        type: getFileType(filePath),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new FileNotFoundError(configId, filePath);
      }
      throw error;
    }
  }

  return files;
}

/**
 * Load only metadata from a configuration (faster for listing)
 */
export async function loadMetadataOnly(configPath: string): Promise<ConfigurationMetadata> {
  const configId = basename(configPath);
  const metadataPath = join(configPath, CONFIG_FILENAME);
  return loadMetadata(metadataPath, configId);
}

/**
 * List configuration directories in a path
 */
export async function listConfigDirectories(libraryPath: string): Promise<string[]> {
  try {
    const entries = await readdir(libraryPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => join(libraryPath, entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Check if a path is a valid configuration directory
 */
export async function isConfigDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(join(path, CONFIG_FILENAME));
    return stats.isFile();
  } catch {
    return false;
  }
}
