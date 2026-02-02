import { describe, it, expect } from "vitest";
import { resolve, sep } from "path";
import { resolveSafePath, PATH_ERRORS } from "../src/lib/config/path-safety.js";

describe("resolveSafePath", () => {
  const baseDir = resolve(process.cwd(), "tmp-base");

  it("returns a resolved path within the base directory", () => {
    const fullPath = resolveSafePath(baseDir, "nested/file.txt");
    expect(fullPath === baseDir || fullPath.startsWith(baseDir + sep)).toBe(true);
  });

  it("allows dot paths that resolve to the base directory", () => {
    const fullPath = resolveSafePath(baseDir, ".");
    expect(fullPath).toBe(baseDir);
  });

  it("allows normalized paths that still remain within base", () => {
    const fullPath = resolveSafePath(baseDir, "a/../b/file.txt");
    expect(fullPath).toBe(resolve(baseDir, "b/file.txt"));
  });

  it("rejects absolute paths", () => {
    const absolutePath = resolve(process.cwd(), "abs.txt");
    expect(() => resolveSafePath(baseDir, absolutePath)).toThrow(PATH_ERRORS.NOT_RELATIVE);
  });

  it("rejects traversal outside the base directory", () => {
    expect(() => resolveSafePath(baseDir, "../evil.txt")).toThrow(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("rejects nested traversal outside the base directory", () => {
    expect(() => resolveSafePath(baseDir, "a/../../evil.txt")).toThrow(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("rejects empty paths", () => {
    expect(() => resolveSafePath(baseDir, "")).toThrow(PATH_ERRORS.EMPTY);
  });

  if (process.platform === "win32") {
    it("rejects Windows drive paths", () => {
      expect(() => resolveSafePath(baseDir, "C:\\\\temp\\\\file.txt")).toThrow(
        PATH_ERRORS.NOT_RELATIVE
      );
    });

    it("rejects Windows UNC paths", () => {
      expect(() => resolveSafePath(baseDir, "\\\\server\\share\\file.txt")).toThrow(
        PATH_ERRORS.NOT_RELATIVE
      );
    });
  } else {
    it("rejects Windows drive paths on non-Windows", () => {
      expect(() => resolveSafePath(baseDir, "C:\\\\temp\\\\file.txt")).toThrow(
        PATH_ERRORS.NOT_RELATIVE
      );
    });

    it("rejects Windows UNC paths on non-Windows", () => {
      expect(() => resolveSafePath(baseDir, "\\\\server\\share\\file.txt")).toThrow(
        PATH_ERRORS.NOT_RELATIVE
      );
    });
  }
});
