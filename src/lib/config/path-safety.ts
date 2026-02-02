import { resolve, isAbsolute, sep, parse } from "path";

export const PATH_ERRORS = {
  EMPTY: "Invalid path: empty or non-string",
  NOT_RELATIVE: "Invalid path: must be relative",
  OUTSIDE_BASE: "Invalid path: outside base directory",
} as const;

/**
 * Ensure a relative path stays within a base directory.
 * Returns the resolved full path or throws if invalid.
 */
export function resolveSafePath(baseDir: string, relativePath: string): string {
  if (!relativePath || typeof relativePath !== "string") {
    throw new Error(PATH_ERRORS.EMPTY);
  }

  // Reject Windows drive letters and UNC paths, even on non-Windows
  if (/^[A-Za-z]:[\\/]/.test(relativePath) || /^\\\\/.test(relativePath)) {
    throw new Error(`${PATH_ERRORS.NOT_RELATIVE} (${relativePath})`);
  }

  // Reject absolute paths on all platforms
  if (isAbsolute(relativePath)) {
    throw new Error(`${PATH_ERRORS.NOT_RELATIVE} (${relativePath})`);
  }

  // Reject Windows drive letters or UNC paths, even on non-Windows
  const parsed = parse(relativePath);
  if (parsed.root && parsed.root !== "." && parsed.root !== sep) {
    throw new Error(`${PATH_ERRORS.NOT_RELATIVE} (${relativePath})`);
  }

  const base = resolve(baseDir);
  const full = resolve(baseDir, relativePath);

  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error(`${PATH_ERRORS.OUTSIDE_BASE} (${relativePath})`);
  }

  return full;
}
