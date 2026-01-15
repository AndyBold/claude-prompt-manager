# Claude Prompt Manager - Build, Test, and Release Management
# Usage: make [target]

.PHONY: all build clean test lint format check install link unlink \
        release-patch release-minor release-major publish help dev

# Default target
all: check build

# ============================================================================
# Build
# ============================================================================

## Build the project (compile TypeScript and copy assets)
build:
	npm run build

## Watch mode for development
dev:
	npm run dev

## Clean build artifacts
clean:
	rm -rf dist/
	rm -rf node_modules/.cache/

## Clean everything including node_modules
clean-all: clean
	rm -rf node_modules/
	rm -f package-lock.json

## Install dependencies
install:
	npm install

## Reinstall dependencies from scratch
reinstall: clean-all install

# ============================================================================
# Quality
# ============================================================================

## Run all checks (lint + format check + test)
check: lint format-check test

## Run linter
lint:
	npm run lint

## Run linter with auto-fix
lint-fix:
	npm run lint:fix

## Check code formatting
format-check:
	npm run format:check

## Format code
format:
	npm run format

## Run tests
test:
	npm run test

## Run tests in watch mode
test-watch:
	npm run test:watch

# ============================================================================
# Local Development
# ============================================================================

## Link package globally for local testing (makes 'cpm' available)
link: build
	npm link

## Unlink package
unlink:
	npm unlink -g claude-prompt-manager

## Run the CLI directly (use: make run ARGS="list")
run: build
	node dist/cli/index.js $(ARGS)

# ============================================================================
# Release
# ============================================================================

## Bump patch version (0.0.x), commit, and tag
release-patch: check
	npm version patch -m "chore: release v%s"
	@echo "Release tagged. Run 'make publish' to publish to npm."

## Bump minor version (0.x.0), commit, and tag
release-minor: check
	npm version minor -m "chore: release v%s"
	@echo "Release tagged. Run 'make publish' to publish to npm."

## Bump major version (x.0.0), commit, and tag
release-major: check
	npm version major -m "chore: release v%s"
	@echo "Release tagged. Run 'make publish' to publish to npm."

## Publish to npm (requires npm login)
publish: check build
	npm publish

## Publish dry-run (see what would be published)
publish-dry: build
	npm publish --dry-run

## Push release tag to remote
push-release:
	git push && git push --tags

# ============================================================================
# Info
# ============================================================================

## Show current version
version:
	@node -p "require('./package.json').version"

## Show package info
info:
	@echo "Package: claude-prompt-manager"
	@echo "Version: $$(node -p "require('./package.json').version")"
	@echo "Node:    $$(node --version)"
	@echo "npm:     $$(npm --version)"

## Show help
help:
	@echo "Claude Prompt Manager - Makefile targets"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Compile TypeScript and copy assets"
	@echo "  make dev          - Watch mode for development"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make clean-all    - Remove build artifacts and node_modules"
	@echo "  make install      - Install dependencies"
	@echo "  make reinstall    - Clean install from scratch"
	@echo ""
	@echo "Quality:"
	@echo "  make check        - Run all checks (lint, format, test)"
	@echo "  make lint         - Run linter"
	@echo "  make lint-fix     - Run linter with auto-fix"
	@echo "  make format       - Format code with Prettier"
	@echo "  make format-check - Check code formatting"
	@echo "  make test         - Run tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo ""
	@echo "Local Development:"
	@echo "  make link         - Link package globally (enables 'cpm' command)"
	@echo "  make unlink       - Unlink package"
	@echo "  make run ARGS=x   - Run CLI with arguments (e.g., make run ARGS='list')"
	@echo ""
	@echo "Release:"
	@echo "  make release-patch - Bump patch version (0.0.x)"
	@echo "  make release-minor - Bump minor version (0.x.0)"
	@echo "  make release-major - Bump major version (x.0.0)"
	@echo "  make publish       - Publish to npm"
	@echo "  make publish-dry   - Dry-run publish"
	@echo "  make push-release  - Push commits and tags to remote"
	@echo ""
	@echo "Info:"
	@echo "  make version      - Show current version"
	@echo "  make info         - Show package info"
	@echo "  make help         - Show this help"
