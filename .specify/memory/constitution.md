<!--
Sync Impact Report:
- Version: 0.0.0 → 1.0.0
- Initial constitution creation
- Principles established: 7 core principles
- Sections added: Core Principles, Quality Standards, Development Workflow, Governance
- Templates status:
  ✅ spec-template.md - reviewed, aligns with principles
  ✅ plan-template.md - reviewed, aligns with principles
  ✅ tasks-template.md - reviewed, aligns with principles
  ✅ checklist-template.md - reviewed, aligns with principles
  ✅ Commands reviewed - all align with specification-first approach
- Follow-up: Monitor adherence to Test-First principle in practice
-->

# Claude Prompt Manager Constitution

## Core Principles

### I. Specification-First Development

Every feature MUST begin with a complete, technology-agnostic specification that defines WHAT and WHY, never HOW.

**Rules**:
- Specifications written in natural language for business stakeholders
- No implementation details (frameworks, languages, databases, APIs)
- Maximum 3 clarification questions per feature - make informed guesses otherwise
- All requirements must be testable and unambiguous

**Rationale**: Separating problem definition from solution enables better planning, clearer communication with stakeholders, and flexibility in technical approach.

### II. Independent User Stories (NON-NEGOTIABLE)

User stories MUST be prioritized (P1, P2, P3...) and independently implementable, testable, and deployable.

**Rules**:
- Each story delivers standalone value - P1 alone is a viable MVP
- Stories can be developed in parallel by different team members
- No cross-story dependencies that break independence
- Each story has its own acceptance criteria and test scenarios
- Use 'bd' for task and story tracking

**Rationale**: Independent stories enable incremental delivery, reduce risk, allow parallel work, and provide clear stopping points for MVP validation.

### III. Test-First (NON-NEGOTIABLE - when tests are requested)

When tests are explicitly requested in the feature specification, TDD is MANDATORY: Tests written → User approved → Tests fail → Then implement.

**Rules**:
- Tests are OPTIONAL - only include when specification requests them
- When tests ARE requested: Red-Green-Refactor cycle strictly enforced
- Contract tests verify API boundaries
- Integration tests verify user journeys
- Tests must fail before implementation begins

**Rationale**: Test-first ensures requirements are testable, catches ambiguity early, and provides confidence in implementation correctness. Making tests optional respects that not all features require comprehensive test coverage.

### IV. Foundational Phase First

Core infrastructure (authentication, database, routing, error handling) MUST be complete before ANY user story implementation begins.

**Rules**:
- Phase 2 (Foundational) blocks all user story work
- Foundational tasks can run in parallel where independent
- Clear checkpoint: "Foundation ready - user story work can begin"
- No user story work until foundation is validated

**Rationale**: Prevents rework when user stories have incompatible infrastructure needs. Enables confident parallel user story development.

### V. Complexity Justification

Every architectural decision that adds complexity (new projects, design patterns, abstractions) MUST be explicitly justified.

**Rules**:
- Document why simpler alternatives were rejected
- Complexity Tracking table required in plan.md for constitution violations
- Default to simplest solution (YAGNI principles)
- Three similar lines > premature abstraction

**Rationale**: Complexity is a liability. Forcing justification prevents over-engineering and keeps codebases maintainable.

### VI. Constitution Compliance Gates

Implementation plans MUST pass constitution checks before research begins, and again after design phase.

**Rules**:
- Constitution Check section mandatory in plan.md
- Gates determined by constitution principles
- Violations require explicit justification in Complexity Tracking table
- Re-check after Phase 1 design artifacts complete

**Rationale**: Early gates catch violations when they're cheap to fix. Double-check after design ensures scope creep doesn't introduce unjustified complexity.

### VII. Incremental Validation

Each user story MUST have an explicit checkpoint for independent validation before proceeding to next priority.

**Rules**:
- "At this point, User Story N should be fully functional and testable independently"
- Stop and validate before moving to next priority
- Each story adds value without breaking previous stories
- MVP = Setup + Foundational + User Story 1

**Rationale**: Continuous validation reduces risk, enables early feedback, and provides natural stopping points for demos/releases.

## Quality Standards

### Specification Quality

All specifications MUST pass validation checklist before proceeding to planning:

- No implementation details (languages, frameworks, APIs)
- Maximum 3 [NEEDS CLARIFICATION] markers total
- All requirements testable and unambiguous
- Success criteria measurable and technology-agnostic
- User scenarios cover primary flows with acceptance criteria
- Scope clearly bounded with dependencies identified

### Planning Quality

All implementation plans MUST:

- Include Constitution Check section (pass gates before Phase 0)
- Document concrete project structure (remove unused options)
- Justify complexity violations in Complexity Tracking table
- Define foundational phase that blocks user story work
- Break user stories into independent, parallel-capable phases
- Include checkpoints for validating each story independently

### Task Quality

All task lists MUST:

- Organize tasks by user story (US1, US2, US3...)
- Mark parallel tasks with [P] indicator
- Include exact file paths in descriptions
- Separate foundational phase from user story phases
- Define clear phase dependencies and execution order
- Include checkpoints after each user story

## Development Workflow

### Feature Lifecycle

1. **Specification** (`/speckit.specify`):
   - Write technology-agnostic spec from natural language
   - Validate against quality checklist
   - Clarify maximum 3 critical questions
   - Output: `specs/###-feature-name/spec.md`

2. **Optional Clarification** (`/speckit.clarify`):
   - Identify underspecified areas
   - Ask up to 5 targeted questions
   - Encode answers back into spec
   - Output: Updated `spec.md`

3. **Planning** (`/speckit.plan`):
   - Research codebase context
   - Design data model and contracts
   - Create quickstart guide
   - Pass constitution checks
   - Output: `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

4. **Task Generation** (`/speckit.tasks`):
   - Generate dependency-ordered tasks
   - Organize by user story
   - Define foundational phase
   - Mark parallel opportunities
   - Output: `tasks.md`

5. **Implementation** (`/speckit.implement`):
   - Execute tasks in dependency order
   - Validate at checkpoints
   - Stop at MVP or continue to next priorities
   - Output: Working feature code

6. **Analysis** (`/speckit.analyze`):
   - Cross-artifact consistency check
   - Quality validation
   - Non-destructive analysis
   - Output: Analysis report

### Branching Strategy

- Feature branches: `###-feature-name` (number calculated from existing branches)
- Specifications in: `specs/###-feature-name/`
- Each feature gets next available number for its short-name
- Check remote, local branches, and spec directories for highest number

## Governance

### Amendment Process

1. Constitution changes require:
   - Documentation of rationale
   - Version bump per semantic versioning (MAJOR.MINOR.PATCH)
   - Sync Impact Report prepended to constitution as HTML comment
   - Updates to dependent templates (spec, plan, tasks, checklists, commands)

2. Version bump rules:
   - **MAJOR**: Backward incompatible principle removal/redefinition
   - **MINOR**: New principle or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance Review

- All specifications validated against quality checklist
- All plans must pass constitution checks
- Task lists must follow organizational structure
- Templates enforced through command workflows

### Template Synchronization

When constitution changes, MUST update:
- `.specify/templates/spec-template.md` - requirement alignment
- `.specify/templates/plan-template.md` - constitution check gates
- `.specify/templates/tasks-template.md` - task categorization
- `.claude/commands/*.md` - command workflows
- Any runtime guidance documents

**Version**: 1.0.0 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
