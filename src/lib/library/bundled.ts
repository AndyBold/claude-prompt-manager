/**
 * Bundled configuration loader
 *
 * Loads configurations shipped with the package.
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Configuration } from "../config/types.js";
import { loadConfiguration, listConfigDirectories } from "../config/loader.js";

/**
 * Get the path to bundled configurations
 */
export function getBundledPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  // Navigate from src/lib/library/ to src/bundled/
  return join(currentDir, "..", "..", "bundled");
}

/**
 * Load all bundled configurations
 */
export async function loadBundledConfigurations(): Promise<Configuration[]> {
  const bundledPath = getBundledPath();
  const dirs = await listConfigDirectories(bundledPath);
  const configs: Configuration[] = [];

  for (const dir of dirs) {
    try {
      const config = await loadConfiguration(dir);
      config.bundled = true;
      configs.push(config);
    } catch {
      // Skip invalid bundled configurations
      console.warn(`Warning: Skipping invalid bundled configuration at ${dir}`);
    }
  }

  return configs;
}

/**
 * Get a specific bundled configuration by ID
 */
export async function getBundledConfiguration(id: string): Promise<Configuration | undefined> {
  const bundledPath = getBundledPath();
  const configPath = join(bundledPath, id);

  try {
    const config = await loadConfiguration(configPath);
    config.bundled = true;
    return config;
  } catch {
    return undefined;
  }
}

/**
 * List bundled configuration IDs
 */
export async function listBundledConfigIds(): Promise<string[]> {
  const configs = await loadBundledConfigurations();
  return configs.map((c) => c.id);
}
