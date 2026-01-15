/**
 * Library management - handles configuration collections
 */

import { join } from "path";
import type { Configuration, SearchCriteria } from "../config/types.js";
import { loadConfiguration, loadMetadataOnly, listConfigDirectories } from "../config/loader.js";
import { writeConfiguration, removeConfiguration } from "../config/writer.js";
import { LIBRARY_PATH } from "../constants.js";
import { ConfigNotFoundError, ConfigExistsError } from "../errors.js";
import { ensureDirectory } from "../config/writer.js";

/**
 * Library manager class
 */
export class LibraryManager {
  private libraryPath: string;
  private bundledPath: string;
  private configCache: Map<string, Configuration> = new Map();

  constructor(libraryPath: string = LIBRARY_PATH, bundledPath?: string) {
    this.libraryPath = libraryPath;
    this.bundledPath = bundledPath || "";
  }

  /**
   * Initialize the library (create directory if needed)
   */
  async initialize(): Promise<void> {
    await ensureDirectory(this.libraryPath);
  }

  /**
   * Set the bundled configurations path
   */
  setBundledPath(path: string): void {
    this.bundledPath = path;
  }

  /**
   * Get all configurations (user + bundled)
   */
  async getAllConfigurations(): Promise<Configuration[]> {
    const [user, bundled] = await Promise.all([
      this.getUserConfigurations(),
      this.getBundledConfigurations(),
    ]);

    return [...bundled, ...user];
  }

  /**
   * Get user configurations only
   */
  async getUserConfigurations(): Promise<Configuration[]> {
    const dirs = await listConfigDirectories(this.libraryPath);
    const configs: Configuration[] = [];

    for (const dir of dirs) {
      try {
        const metadata = await loadMetadataOnly(dir);
        configs.push({
          ...metadata,
          fileContents: [],
          bundled: false,
          sourcePath: dir,
        });
      } catch {
        // Skip invalid configurations
      }
    }

    return configs;
  }

  /**
   * Get bundled configurations only
   */
  async getBundledConfigurations(): Promise<Configuration[]> {
    if (!this.bundledPath) {
      return [];
    }

    const dirs = await listConfigDirectories(this.bundledPath);
    const configs: Configuration[] = [];

    for (const dir of dirs) {
      try {
        const metadata = await loadMetadataOnly(dir);
        configs.push({
          ...metadata,
          fileContents: [],
          bundled: true,
          sourcePath: dir,
        });
      } catch {
        // Skip invalid configurations
      }
    }

    return configs;
  }

  /**
   * Get a specific configuration by ID
   */
  async getConfiguration(id: string): Promise<Configuration> {
    // Check cache first
    if (this.configCache.has(id)) {
      return this.configCache.get(id)!;
    }

    // Try user library first
    const userPath = join(this.libraryPath, id);
    try {
      const config = await loadConfiguration(userPath);
      config.bundled = false;
      this.configCache.set(id, config);
      return config;
    } catch {
      // Not in user library
    }

    // Try bundled
    if (this.bundledPath) {
      const bundledPath = join(this.bundledPath, id);
      try {
        const config = await loadConfiguration(bundledPath);
        config.bundled = true;
        this.configCache.set(id, config);
        return config;
      } catch {
        // Not in bundled either
      }
    }

    throw new ConfigNotFoundError(id);
  }

  /**
   * Check if a configuration exists
   */
  async configurationExists(id: string): Promise<boolean> {
    try {
      await this.getConfiguration(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add a new configuration to the library
   */
  async addConfiguration(config: Configuration): Promise<void> {
    if (await this.configurationExists(config.id)) {
      throw new ConfigExistsError(config.id);
    }

    const configPath = join(this.libraryPath, config.id);
    await writeConfiguration(config, configPath);
    this.configCache.delete(config.id);
  }

  /**
   * Update an existing configuration
   */
  async updateConfiguration(config: Configuration): Promise<void> {
    const existing = await this.getConfiguration(config.id);

    if (existing.bundled) {
      throw new Error(`Cannot update bundled configuration "${config.id}"`);
    }

    const configPath = join(this.libraryPath, config.id);
    await writeConfiguration(config, configPath);
    this.configCache.delete(config.id);
  }

  /**
   * Remove a configuration from the library
   */
  async removeConfig(id: string): Promise<void> {
    const config = await this.getConfiguration(id);

    if (config.bundled) {
      throw new Error(`Cannot remove bundled configuration "${id}"`);
    }

    const configPath = join(this.libraryPath, id);
    await removeConfiguration(configPath);
    this.configCache.delete(id);
  }

  /**
   * Search configurations
   */
  async searchConfigurations(criteria: SearchCriteria): Promise<Configuration[]> {
    let configs: Configuration[];

    if (criteria.bundledOnly) {
      configs = await this.getBundledConfigurations();
    } else if (criteria.userOnly) {
      configs = await this.getUserConfigurations();
    } else {
      configs = await this.getAllConfigurations();
    }

    return filterConfigurations(configs, criteria);
  }

  /**
   * Clear the configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get the library path
   */
  getLibraryPath(): string {
    return this.libraryPath;
  }

  /**
   * Get the bundled path
   */
  getBundledPath(): string {
    return this.bundledPath;
  }
}

/**
 * Filter configurations by search criteria
 */
function filterConfigurations(configs: Configuration[], criteria: SearchCriteria): Configuration[] {
  return configs.filter((config) => {
    // Filter by query (name, description, tags)
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      const searchableText = [config.name, config.description, ...config.tags, ...config.languages]
        .join(" ")
        .toLowerCase();

      const terms = query.split(/\s+/);
      if (!terms.every((term) => searchableText.includes(term))) {
        return false;
      }
    }

    // Filter by project types
    if (criteria.projectTypes && criteria.projectTypes.length > 0) {
      if (!criteria.projectTypes.some((t) => config.projectTypes.includes(t))) {
        return false;
      }
    }

    // Filter by languages
    if (criteria.languages && criteria.languages.length > 0) {
      const configLangs = config.languages.map((l) => l.toLowerCase());
      if (!criteria.languages.some((l) => configLangs.includes(l.toLowerCase()))) {
        return false;
      }
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      const configTags = config.tags.map((t) => t.toLowerCase());
      if (!criteria.tags.some((t) => configTags.includes(t.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Create a default library manager instance
 */
export function createLibraryManager(libraryPath?: string, bundledPath?: string): LibraryManager {
  return new LibraryManager(libraryPath, bundledPath);
}
