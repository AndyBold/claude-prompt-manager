# Tasks: Claude Code Configuration Library Manager

**Input**: Design documents from `/specs/001-config-library-manager/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/cli-interface.md ✓

**Tests**: Not requested in feature specification - tests are optional per constitution (III. Test-First: DEFERRED).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize TypeScript 5.x project with package.json, tsconfig.json, and Node.js 20 LTS configuration
- [x] T002 [P] Install production dependencies: commander, diff, glob, yaml
- [x] T003 [P] Install dev dependencies: typescript, vitest, @types/node, eslint, prettier
- [x] T004 [P] Configure ESLint and Prettier for TypeScript in .eslintrc.js and .prettierrc
- [x] T005 [P] Create base project directory structure per plan.md in src/cli/, src/lib/, src/bundled/, src/skill/
- [x] T006 Configure build scripts in package.json (build, lint, format, prepublish)
- [x] T007 [P] Create src/lib/constants.ts with paths, defaults, and platform-specific library locations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define core TypeScript interfaces in src/lib/config/types.ts (Configuration, ConfigurationFile, Library, ResolvedConfiguration, SearchCriteria, ApplyOptions, ApplyResult, MergeResult)
- [x] T009 [P] Implement configuration loader in src/lib/config/loader.ts (load config.yaml and files from directory)
- [x] T010 [P] Implement configuration validator in src/lib/config/validator.ts (validate metadata schema, id format, required fields)
- [x] T011 Implement inheritance resolver in src/lib/config/resolver.ts (depth-first parent loading, deep merge, override/exclude markers, cycle detection)
- [x] T012 [P] Implement configuration writer in src/lib/config/writer.ts (save config.yaml and files to directory)
- [x] T013 Implement library index in src/lib/library/index.ts (list configurations, load metadata, CRUD operations)
- [x] T014 [P] Create structured error types in src/lib/errors.ts (ConfigNotFound, InvalidConfig, ConflictDetected, InheritanceCycle, PermissionDenied)
- [x] T015 Setup CLI entry point in src/cli/index.ts with Commander.js (global options: --version, --help, --library, --verbose, --json)
- [x] T016 [P] Create CLI output utilities in src/cli/utils/output.ts (table formatting, colored output, JSON output mode)
- [x] T017 [P] Create CLI prompt utilities in src/cli/utils/prompts.ts (confirmation prompts, choice selection)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Apply Configuration to New Project (Priority: P1) 🎯 MVP

**Goal**: Enable developers to apply pre-configured Claude Code configurations from the library to new project directories

**Independent Test**: Run `cpm list` to see configurations, then `cpm apply typescript-react ./test-project` and verify CLAUDE.md and .claude/settings.json are created

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement `list` command in src/cli/commands/list.ts (list all configs, filter by project-type/language/tag, --bundled/--user/--json flags)
- [x] T019 [P] [US1] Implement `show` command in src/cli/commands/show.ts (display config details, --files/--content/--resolved/--json flags)
- [x] T020 [P] [US1] Implement existing configuration detector in src/lib/apply/detector.ts (check for CLAUDE.md, .claude/ directory in target)
- [x] T021 [US1] Implement apply logic in src/lib/apply/index.ts (resolve config, copy files to target, handle create mode)
- [x] T022 [US1] Implement `apply` command in src/cli/commands/apply.ts (apply config to target path, --dry-run flag, success output with file counts)
- [x] T023 [US1] Create typescript-base bundled configuration in src/bundled/typescript-base/ (config.yaml, CLAUDE.md template)
- [x] T024 [P] [US1] Create typescript-react bundled configuration in src/bundled/typescript-react/ (extends typescript-base)
- [x] T025 [P] [US1] Create typescript-node bundled configuration in src/bundled/typescript-node/ (extends typescript-base)
- [x] T026 [US1] Implement bundled configuration loader in src/lib/library/bundled.ts (load configs from bundled directory, mark as read-only)
- [x] T027 [US1] Wire up list, show, apply commands in src/cli/index.ts
- [x] T028 [US1] Add exit codes per CLI contract (0=success, 1=error, 2=not found, 3=validation, 4=conflict, 5=permission)

**Checkpoint**: User Story 1 complete - users can list bundled configurations and apply them to new projects

---

## Phase 4: User Story 2 - Apply Configuration to Existing Project (Priority: P2)

**Goal**: Enable developers to add or update Claude Code configuration in projects that already have some configuration files

**Independent Test**: Create a project with existing CLAUDE.md, run `cpm apply typescript-react --merge` and verify interactive conflict resolution works

### Implementation for User Story 2

- [x] T029 [P] [US2] Implement diff generator in src/lib/apply/differ.ts (generate unified diff between existing and new content using diff library)
- [x] T030 [US2] Implement merge logic in src/lib/apply/merger.ts (section-level merge for markdown using headers, deep merge for JSON, conflict markers)
- [x] T031 [US2] Add conflict resolution UI in src/cli/utils/conflict.ts (display diff, prompt for keep/replace/merge per file)
- [x] T032 [US2] Extend apply logic in src/lib/apply/index.ts to support --merge and --force modes
- [x] T033 [US2] Update `apply` command in src/cli/commands/apply.ts (--force, --merge, --no-interactive flags, conflict flow)
- [x] T034 [US2] Handle partial application in src/lib/apply/index.ts (track filesCreated, filesModified, filesSkipped, conflicts in ApplyResult)

**Checkpoint**: User Story 2 complete - users can merge/replace configurations in existing projects with interactive conflict resolution

---

## Phase 5: User Story 3 - Create New Configuration via Claude Code Skill (Priority: P3)

**Goal**: Enable developers to use a Claude Code skill to create new configuration templates interactively

**Independent Test**: Run `/create-config` in Claude Code and follow prompts to create a new configuration, verify it appears in `cpm list --user`

### Implementation for User Story 3

- [x] T035 [P] [US3] Create Claude Code skill template in src/skill/create-config.md (prompts for name, description, project type, languages, testing approach)
- [x] T036 [US3] Implement `create` command in src/cli/commands/create.ts (--name, --description, --extends, --project-type, --language, --tag flags)
- [x] T037 [US3] Add --interactive mode to create command in src/cli/commands/create.ts (guided prompts for all fields)
- [x] T038 [US3] Add --from-project mode to create command in src/cli/commands/create.ts (extract config from existing project's Claude files)
- [x] T039 [US3] Wire up create command in src/cli/index.ts
- [x] T040 [US3] Install skill file to .claude/commands/create-config.md on npm install (postinstall script or manual instruction)

**Checkpoint**: User Story 3 complete - users can create custom configurations via CLI or Claude Code skill

---

## Phase 6: User Story 4 - Browse and Search Configuration Library (Priority: P4)

**Goal**: Enable developers to search and filter the configuration library to find appropriate configurations

**Independent Test**: Run `cpm search "react typescript"` and verify relevant configurations are returned with highlighted matches

### Implementation for User Story 4

- [x] T041 [P] [US4] Implement search logic in src/lib/library/search.ts (free-text search across name, description, tags)
- [x] T042 [US4] Implement `search` command in src/cli/commands/search.ts (query argument, --project-type/--language filters, --json flag)
- [x] T043 [US4] Add search results formatting in src/cli/utils/output.ts (show matching configs with highlighted search terms)
- [x] T044 [US4] Wire up search command in src/cli/index.ts

**Checkpoint**: User Story 4 complete - users can search and filter configurations by keyword and attributes

---

## Phase 7: User Story 5 - Manage Configuration Library (Priority: P5)

**Goal**: Enable library maintainers to update and remove configurations, keeping the library well-organized

**Independent Test**: Run `cpm update my-config --add-tag newtag --bump-version minor` and verify changes, then `cpm remove old-config` and verify deletion

### Implementation for User Story 5

- [x] T045 [P] [US5] Implement `update` command in src/cli/commands/update.ts (--name, --description, --add-tag, --remove-tag, --bump-version flags)
- [x] T046 [P] [US5] Implement `remove` command in src/cli/commands/remove.ts (--force, --archive flags, confirmation prompt)
- [x] T047 [P] [US5] Implement `validate` command in src/cli/commands/validate.ts (validate metadata, files exist, inheritance chain, --fix flag)
- [x] T048 [US5] Wire up update, remove, validate commands in src/cli/index.ts
- [ ] T049 [US5] Create additional bundled configurations in src/bundled/ (python-base, python-fastapi, python-django, go-base, go-cli, go-api) - DEFERRED for future release

**Checkpoint**: User Story 5 complete - full library management capabilities available

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T050 [P] Add environment variable support (CPM_LIBRARY_PATH, CPM_NO_COLOR, CPM_VERBOSE) in src/lib/constants.ts
- [x] T051 [P] Add --verbose logging across all commands in src/cli/utils/logger.ts
- [x] T052 [P] Finalize CLI help text and examples for all commands
- [x] T053 [P] Add npm bin configuration for global `cpm` command in package.json
- [x] T054 Verify quickstart.md scenarios work end-to-end
- [x] T055 Build and verify TypeScript compilation produces working dist/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - Limited parallelization possible between stories (see below)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Delivers MVP.
- **User Story 2 (P2)**: Can start after US1 T021 (apply logic base). Extends apply with merge/conflict features.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent from US1/US2. Creates new configs.
- **User Story 4 (P4)**: Can start after T013 (library index) - Independent search functionality.
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Library management is independent.

### Within Each User Story

- Models/types before services
- Services/logic before CLI commands
- CLI commands wired up after implementation
- Story complete before moving to next priority (for single developer)

### Parallel Opportunities

**Phase 1 (Setup):**
```
T002, T003, T004, T005, T007 can run in parallel after T001
```

**Phase 2 (Foundational):**
```
T009, T010, T012, T014, T016, T017 can run in parallel after T008
```

**Phase 3 (User Story 1):**
```
T018, T019, T020 can run in parallel
T024, T025 can run in parallel after T023
```

**Multi-story parallelism:**
```
After Phase 2 complete:
- US4 (T041-T044) can run in parallel with US1
- US5 (T045-T047) can run in parallel with US1
- US3 (T035-T040) can run in parallel with US1
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test `cpm list`, `cpm show`, `cpm apply` independently
5. Deploy/demo if ready - users can apply bundled configurations to new projects

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP: apply configs to new projects)
3. Add User Story 2 → Test independently → Deploy (merge with existing configs)
4. Add User Story 3 → Test independently → Deploy (create custom configs)
5. Add User Story 4 → Test independently → Deploy (search functionality)
6. Add User Story 5 → Test independently → Deploy (library management)
7. Each story adds value without breaking previous stories

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers:
- Working CLI tool with `cpm list`, `cpm show`, `cpm apply`
- 3 bundled TypeScript configurations (base, react, node)
- Ability to apply configurations to new projects

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Bundled configs use inheritance (typescript-base → typescript-react/typescript-node)
- Library stored at `~/.config/claude-prompt-manager/library/` (per research.md)
