import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { writeConfigFiles, writeFilesToProject } from "../src/lib/config/writer.js";
import { loadConfiguration } from "../src/lib/config/loader.js";
import { applyConfiguration } from "../src/lib/apply/index.js";
import { getConflictingFiles } from "../src/lib/apply/detector.js";
import { PATH_ERRORS } from "../src/lib/config/path-safety.js";
import type { Configuration } from "../src/lib/config/types.js";
import { CONFIG_FILENAME } from "../src/lib/constants.js";

describe("path safety at IO call sites", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "cpm-test-"));
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("writeFilesToProject rejects traversal paths", async () => {
    const result = await writeFilesToProject(
      [{ path: "../evil.txt", content: "nope", type: "text" }],
      tempDir
    );

    expect(result.created.length).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("writeConfigFiles rejects traversal paths", async () => {
    await expect(
      writeConfigFiles([{ path: "../evil.txt", content: "nope", type: "text" }], tempDir)
    ).rejects.toThrow(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("loadConfiguration rejects traversal paths in metadata files list", async () => {
    const configDir = join(tempDir, "bad-config");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, CONFIG_FILENAME),
      [
        "name: Bad Config",
        "description: should fail",
        "version: 1.0.0",
        "projectTypes: [cli]",
        "languages: [typescript]",
        "files:",
        "  - ../evil.txt",
      ].join("\n"),
      "utf-8"
    );

    await expect(loadConfiguration(configDir)).rejects.toThrow(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("applyConfiguration reports errors when file paths escape the target", async () => {
    const config: Configuration = {
      id: "bad-config",
      name: "Bad Config",
      description: "should fail",
      version: "1.0.0",
      projectTypes: ["cli"],
      languages: ["typescript"],
      tags: [],
      created: new Date(),
      updated: new Date(),
      files: ["../evil.txt"],
      fileContents: [{ path: "../evil.txt", content: "nope", type: "text" }],
    };

    const result = await applyConfiguration(
      config,
      { configId: config.id, targetPath: tempDir, mode: "create" },
      async () => undefined
    );

    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain(PATH_ERRORS.OUTSIDE_BASE);
  });

  it("getConflictingFiles ignores traversal paths", async () => {
    const targetDir = join(tempDir, "project");
    await mkdir(targetDir, { recursive: true });

    const outsideFile = join(tempDir, "outside.txt");
    await writeFile(outsideFile, "data", "utf-8");

    const conflicts = await getConflictingFiles(targetDir, ["../outside.txt"]);
    expect(conflicts.length).toBe(0);
  });

  it("getConflictingFiles reports conflicts for in-base files", async () => {
    const targetDir = join(tempDir, "project");
    await mkdir(targetDir, { recursive: true });

    const inBaseFile = join(targetDir, "file.txt");
    await writeFile(inBaseFile, "data", "utf-8");

    const conflicts = await getConflictingFiles(targetDir, ["file.txt"]);
    expect(conflicts).toEqual(["file.txt"]);
  });
});
