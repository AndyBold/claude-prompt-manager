# Security Best Practices Report

## Executive Summary
I reviewed the TypeScript CLI codebase for security risks related to filesystem access and configuration handling. The main risks are path traversal leading to arbitrary file reads and writes when processing configuration files. These issues become critical if configurations can be sourced from untrusted locations (shared libraries, downloaded bundles, or accidental malicious edits). I recommend enforcing strict path normalization and base-directory containment checks before any filesystem read/write based on configuration-provided paths.

## Critical Findings

### [S-1] Path traversal allows arbitrary file writes during apply and configuration writes
**Impact:** A malicious configuration can overwrite files outside the intended target directory (e.g., shell profile, SSH keys), resulting in local compromise or data loss.

**Locations**
- `src/lib/config/writer.ts:71-99` (joins `targetPath`/`projectPath` with unvalidated `file.path`)
- `src/lib/apply/index.ts:64-69`, `src/lib/apply/index.ts:120-123` (reads/writes based on unvalidated `file.path`)

**Details**
`writeConfigFiles` and `writeFilesToProject` compute paths via `join(base, file.path)` and then write content without ensuring `file.path` is relative and contained within the base directory. If `file.path` includes `../` segments or absolute paths, `join` can escape the base directory. `applyConfiguration` then uses those paths for reads and writes when handling conflicts and merges.

**Recommendation**
Add a centralized path validation helper that:
- Rejects absolute paths on all platforms (`path.isAbsolute`).
- Normalizes and resolves the final path (`path.resolve(base, filePath)`) and enforces that it starts with the resolved base path plus a path separator.
- Rejects paths containing Windows drive letters or UNC prefixes when running on non-Windows.
- Apply this validation before any filesystem read/write derived from configuration file lists.

## High Findings

### [S-2] Path traversal allows arbitrary file reads during configuration load
**Impact:** A malicious configuration can read files outside the configuration directory and expose their contents via normal CLI output or merges.

**Locations**
- `src/lib/config/loader.ts:95-111` (joins `configPath` with unvalidated `filePath` and reads it)

**Details**
`loadConfigFiles` reads files listed in `config.yaml` via `join(configPath, filePath)` without validating that `filePath` stays within the configuration directory. This allows reading arbitrary files on disk if a configuration is tampered with or supplied by an untrusted source.

**Recommendation**
Reuse the same base-directory containment checks recommended in [S-1] to ensure `filePath` stays within the configuration directory before reading.

## Medium Findings

### [S-3] Path validation is incomplete and not consistently enforced
**Locations**
- `src/lib/config/validator.ts:134-141`

**Details**
`validateConfiguration` checks only `filePath.startsWith("/")` and `filePath.includes("..")`. This does not catch Windows absolute paths (e.g., `C:\\Windows\\...`), UNC paths, or other traversal tricks, and it is not consistently enforced before read/write operations.

**Recommendation**
Replace the string checks with robust normalization and base-directory containment checks (as in [S-1]). Ensure validation is enforced when loading/applying configurations, not just when creating them.
