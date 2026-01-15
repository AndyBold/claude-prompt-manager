/**
 * Structured error types for Claude Prompt Manager
 *
 * Each error type provides user-friendly messages and appropriate exit codes.
 */

import { EXIT_CODES } from "./constants.js";

/**
 * Base error class for all CPM errors
 */
export abstract class CpmError extends Error {
  abstract readonly code: number;
  abstract readonly userMessage: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Configuration not found in library
 */
export class ConfigNotFoundError extends CpmError {
  readonly code = EXIT_CODES.NOT_FOUND;
  readonly userMessage: string;

  constructor(configId: string) {
    super(`Configuration "${configId}" not found in library`);
    this.userMessage = `Configuration "${configId}" not found. Run \`cpm list\` to see available configurations.`;
  }
}

/**
 * Configuration has invalid structure or metadata
 */
export class InvalidConfigError extends CpmError {
  readonly code = EXIT_CODES.VALIDATION_ERROR;
  readonly userMessage: string;

  constructor(configId: string, reason: string) {
    super(`Configuration "${configId}" is invalid: ${reason}`);
    this.userMessage = `Configuration "${configId}" has invalid metadata: ${reason}`;
  }
}

/**
 * File conflict detected during apply
 */
export class ConflictDetectedError extends CpmError {
  readonly code = EXIT_CODES.CONFLICT;
  readonly userMessage: string;
  readonly conflictingFiles: string[];

  constructor(conflictingFiles: string[]) {
    super(`Conflict detected for files: ${conflictingFiles.join(", ")}`);
    this.conflictingFiles = conflictingFiles;
    this.userMessage = `Project already has Claude Code configuration. Use \`--force\` to replace or \`--merge\` to combine.`;
  }
}

/**
 * Circular inheritance detected in configuration chain
 */
export class InheritanceCycleError extends CpmError {
  readonly code = EXIT_CODES.VALIDATION_ERROR;
  readonly userMessage: string;
  readonly cycle: string[];

  constructor(cycle: string[]) {
    super(`Circular inheritance detected: ${cycle.join(" → ")}`);
    this.cycle = cycle;
    this.userMessage = `Circular inheritance detected: ${cycle.join(" → ")}. Remove cycle to continue.`;
  }
}

/**
 * Permission denied for file operation
 */
export class PermissionDeniedError extends CpmError {
  readonly code = EXIT_CODES.PERMISSION_DENIED;
  readonly userMessage: string;
  readonly path: string;

  constructor(path: string) {
    super(`Permission denied: cannot access "${path}"`);
    this.path = path;
    this.userMessage = `Cannot write to ${path}. Check directory permissions.`;
  }
}

/**
 * Library path does not exist or is not accessible
 */
export class LibraryNotFoundError extends CpmError {
  readonly code = EXIT_CODES.NOT_FOUND;
  readonly userMessage: string;

  constructor(path: string) {
    super(`Library not found at "${path}"`);
    this.userMessage = `Library directory not found at ${path}. It will be created on first use.`;
  }
}

/**
 * Configuration already exists (during create)
 */
export class ConfigExistsError extends CpmError {
  readonly code = EXIT_CODES.GENERAL_ERROR;
  readonly userMessage: string;

  constructor(configId: string) {
    super(`Configuration "${configId}" already exists`);
    this.userMessage = `Configuration "${configId}" already exists. Choose a different ID or remove the existing configuration first.`;
  }
}

/**
 * Parent configuration not found (during inheritance resolution)
 */
export class ParentNotFoundError extends CpmError {
  readonly code = EXIT_CODES.NOT_FOUND;
  readonly userMessage: string;

  constructor(configId: string, parentId: string) {
    super(`Parent configuration "${parentId}" not found for "${configId}"`);
    this.userMessage = `Configuration "${configId}" extends "${parentId}", but parent was not found.`;
  }
}

/**
 * File not found in configuration
 */
export class FileNotFoundError extends CpmError {
  readonly code = EXIT_CODES.NOT_FOUND;
  readonly userMessage: string;

  constructor(configId: string, filePath: string) {
    super(`File "${filePath}" not found in configuration "${configId}"`);
    this.userMessage = `Configuration "${configId}" references file "${filePath}" but it does not exist.`;
  }
}

/**
 * Check if error is a CpmError
 */
export function isCpmError(error: unknown): error is CpmError {
  return error instanceof CpmError;
}

/**
 * Get exit code from error (CpmError or general)
 */
export function getExitCode(error: unknown): number {
  if (isCpmError(error)) {
    return error.code;
  }
  return EXIT_CODES.GENERAL_ERROR;
}

/**
 * Get user-friendly message from error
 */
export function getUserMessage(error: unknown): string {
  if (isCpmError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
