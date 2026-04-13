# Get Things Done (GTD) — Build and Publish Guide

> Complete guide for developers who want to build GTD from source, run tests, and publish to npm.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone and Setup](#clone-and-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Building the SDK](#building-the-sdk)
- [Publishing to npm](#publishing-to-npm)
- [Publishing the SDK](#publishing-the-sdk)
- [CI/CD Pipeline](#cicd-pipeline)
- [Release Process](#release-process)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | >= 20.0.0 | `node --version` |
| **npm** | >= 10.0.0 | `npm --version` |
| **Git** | Any recent | `git --version` |

Optional:
- **GitHub CLI** (`gh`) — for creating releases
- **TypeScript** — only needed if modifying the SDK (`npm install -g typescript`)

---

## Clone and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/get-things-done/get-things-done.git
cd get-things-done
```

### 2. Install Dependencies

```bash
npm install
```

This installs dev dependencies (vitest, eslint, prettier, husky, lint-staged) and sets up git hooks.

### 3. Verify Installation

```bash
# Run the full test suite
npm test

# Expected output:
# Test Files  26 passed (26)
# Tests       1030 passed (1030)
```

### 4. Verify CLI Tools

```bash
# Version check
node bin/gtd-tools.cjs version
# Output: 1.0.0

# Config check
node bin/gtd-tools.cjs config-get scan.max_files
# Output: 10000

# State check
node bin/gtd-tools.cjs state get
# Output: { "mode": "bidirectional", "forward": { "status": "empty" }, ... }

# Installer check
node bin/install.js --version
# Output: get-things-done v1.0.0
```

---

## Project Structure

```
get-things-done/
├── bin/
│   ├── install.js              # npx entry point (installer)
│   └── gtd-tools.cjs           # CLI tools layer (17 commands)
├── lib/                         # Core modules (CJS)
│   ├── config.cjs              # Configuration management
│   ├── state.cjs               # Bidirectional state machine
│   ├── init.cjs                # Workflow context assembly
│   ├── file-ops.cjs            # Atomic writes, file utilities
│   ├── frontmatter.cjs         # YAML frontmatter parser
│   ├── git.cjs                 # Git operations
│   ├── analysis.cjs            # Analysis cache management
│   ├── template.cjs            # Template engine
│   ├── docs.cjs                # Document management
│   ├── phase.cjs               # Phase management (forward)
│   ├── roadmap.cjs             # Roadmap parsing (forward)
│   ├── deploy.cjs              # Local deployment detection
│   ├── test-runner.cjs         # Test framework detection
│   ├── diff-engine.cjs         # Change detection (incremental)
│   ├── drift-engine.cjs        # Drift detection (sync)
│   ├── security.cjs            # Secret scanner, error codes
│   ├── scale-adapter.cjs       # Project tier detection
│   ├── agent-skills.cjs        # Agent registry (33 agents)
│   ├── installer-core.cjs      # Installer shared logic
│   └── installers/             # 9 runtime-specific adapters
│       ├── claude.cjs
│       ├── cursor.cjs
│       └── ... (7 more)
├── agents/                      # Agent definitions (Markdown)
│   ├── forward/   (12 agents)
│   ├── backward/  (18 agents)
│   └── sync/      (3 agents)
├── commands/gtd/                # User-facing commands
│   ├── forward/   (16 commands)
│   ├── backward/  (15 commands)
│   ├── sync/      (4 commands)
│   └── utility/   (5 commands)
├── workflows/                   # Orchestration logic
│   ├── forward/   (18 workflows)
│   ├── backward/  (7 workflows)
│   └── sync/      (4 workflows)
├── references/     (11 docs)    # Shared knowledge
├── templates/                   # Document + plan templates
│   ├── forward/   (10 templates)
│   └── backward/  (11 templates)
├── contexts/       (6 profiles) # Agent context loading
├── hooks/          (4 hooks)    # Runtime hooks
├── sdk/                         # TypeScript SDK
│   ├── src/       (3 TS files)
│   └── examples/  (3 examples)
├── tests/          (26 files)   # 1,030 tests
├── test-fixtures/               # Sample projects
│   ├── micro-project/
│   └── small-project/
└── docs/                        # Documentation
    ├── design/    (7 design docs)
    ├── BUILD-AND-PUBLISH.md     # This file
    └── USER-GUIDE.md
```

---

## Development Workflow

### Making Changes

1. **Lib modules** (`lib/*.cjs`): Core logic. Write in CommonJS for maximum Node.js compatibility.
2. **Agent definitions** (`agents/**/*.md`): Markdown with YAML frontmatter. These are prompts, not code.
3. **Workflows** (`workflows/**/*.md`): Orchestration logic in Markdown. Reference agents and tools.
4. **Commands** (`commands/gtd/**/*.md`): User-facing entry points. Each references a workflow.
5. **Templates** (`templates/**/*.md`): Document templates with `{{variable}}` syntax.
6. **References** (`references/*.md`): Shared knowledge documents agents reference.

### Code Style

```bash
# Lint
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format
npm run format

# Check formatting
npm run format:check

# Run all quality checks
npm run quality
```

### Pre-commit Hooks

Husky runs automatically on commit:
- ESLint on `.js`, `.cjs`, `.ts` files
- Prettier on all supported files

---

## Running Tests

### Full Suite

```bash
npm test
# or
npx vitest run
```

### Watch Mode (during development)

```bash
npm run test:watch
# or
npx vitest watch
```

### Specific Test File

```bash
npx vitest run tests/config.test.cjs
npx vitest run tests/security.test.cjs
```

### With Coverage

```bash
npm run test:coverage
```

Coverage report is generated in `coverage/` directory. Open `coverage/index.html` in a browser.

### Test Structure

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `scaffold.test.cjs` | 59 | Project structure, directories, package.json |
| `file-ops.test.cjs` | 15 | Atomic write, findProjectRoot, file utilities |
| `frontmatter.test.cjs` | 11 | YAML frontmatter parse/serialize |
| `config.test.cjs` | 19 | Config load, get, set, defaults, absent=enabled |
| `state.test.cjs` | 33 | State machine, transitions, document status |
| `init.test.cjs` | 17 | Workflow context assembly, arg parsing |
| `git.test.cjs` | 9 | Git operations (commit, branch, changes) |
| `analysis.test.cjs` | 11 | Analysis cache, staleness, dimensions |
| `agent-skills.test.cjs` | 13 | Agent registry, categories, listing |
| `scanner.test.cjs` | 37 | Codebase mapper, framework signatures, refs |
| `analyzers.test.cjs` | 113 | All 7 analyzer agents + refs + workflow |
| `template.test.cjs` | 25 | Template engine (fill, conditionals, resolve) |
| `docs.test.cjs` | 18 | Document management (list, finalize, archive) |
| `writers.test.cjs` | 92 | 7 writer agents + diagram gen + commands |
| `verification.test.cjs` | 31 | Accuracy verifier + completeness auditor |
| `orchestration.test.cjs` | 63 | Full backward pipeline E2E |
| `forward-planning.test.cjs` | 67 | Phase/roadmap modules, planning agents |
| `forward-execution.test.cjs` | 57 | Executor, verifier, debugger agents |
| `deploy-test.test.cjs` | 26 | Deploy detection, test framework detection |
| `forward-orchestration.test.cjs` | 49 | Full forward pipeline E2E |
| `sync.test.cjs` | 49 | Drift engine, sync agents, workflows |
| `installer.test.cjs` | 72 | Installer core, 9 adapters, E2E install |
| `diff-engine.test.cjs` | 31 | Change classification, impact mapping, sections |
| `sdk.test.cjs` | 39 | SDK types, API, tools wrapper, CI examples |
| `security.test.cjs` | 39 | Secret scanner, injection guard, error codes |
| `enterprise.test.cjs` | 35 | Scale tiers, compliance templates |

---

## Building the SDK

The SDK is a separate TypeScript package in `sdk/`.

```bash
cd sdk

# Install SDK dependencies (TypeScript + Node type definitions)
npm install

# Compile TypeScript to JavaScript
npx tsc

# Output goes to sdk/dist/
# Should produce: index.js, index.d.ts, types.js, types.d.ts, gtd-tools.js, gtd-tools.d.ts
ls dist/
```

**Required SDK devDependencies** (already in `sdk/package.json`):
- `typescript` — TypeScript compiler
- `@types/node` — Node.js type definitions

The compiled SDK can be published separately as `get-things-done-sdk`.

---

## Publishing to npm

### Pre-publish Checklist

```bash
# 1. Run full quality checks
npm run quality

# 2. Verify version in package.json
node -e "console.log(require('./package.json').version)"

# 3. Check what files will be published
npm pack --dry-run

# 4. Review .npmignore — ensure test fixtures, design docs, dev configs are excluded
```

### Publish

```bash
# Login to npm (first time only)
npm login

# Publish
npm publish

# Or publish with a tag
npm publish --tag beta
```

### What Gets Published

The `.npmignore` ensures only these directories are in the npm package:
- `bin/` — Installer + CLI tools
- `lib/` — Core modules + runtime adapters
- `agents/` — 33 agent definitions
- `commands/` — 40 command files
- `workflows/` — 29 workflow files
- `references/` — 11 knowledge documents
- `templates/` — 21 template files
- `contexts/` — 6 context profiles
- `hooks/` — 4 runtime hooks
- `package.json`, `README.md`, `LICENSE`

**Excluded:** tests, test-fixtures, design docs, SDK source, dev configs, node_modules.

### Verify Published Package

After publishing:

```bash
# Install in a new temp directory to verify
mkdir /tmp/test-gtd && cd /tmp/test-gtd
npx get-things-done@latest --version
# Should output: get-things-done v1.0.0

npx get-things-done@latest --help
# Should show usage information
```

---

## Publishing the SDK

```bash
cd sdk

# Build
npx tsc

# Verify
ls dist/
# Should have: index.js, index.d.ts, types.js, types.d.ts, gtd-tools.js, gtd-tools.d.ts

# Publish
npm publish
```

---

## CI/CD Pipeline

### GitHub Actions (already configured)

The `.github/workflows/test.yml` runs on every push and PR:

```yaml
- Tests run on Node.js 20 and 22
- Lint check
- Full test suite
- Coverage report (Node 20 only)
```

### Release Workflow (manual)

```bash
# 1. Update version
npm version patch   # 1.0.0 -> 1.0.1
# or
npm version minor   # 1.0.0 -> 1.1.0
# or
npm version major   # 1.0.0 -> 2.0.0

# 2. This auto-commits and tags

# 3. Push with tags
git push && git push --tags

# 4. Publish
npm publish

# 5. Create GitHub release
gh release create v$(node -e "console.log(require('./package.json').version)") \
  --title "v$(node -e "console.log(require('./package.json').version)")" \
  --generate-notes
```

---

## Release Process

### Version Numbering

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| Bug fix, typo in agent prompt | Patch | 1.0.0 → 1.0.1 |
| New agent, new command, new template | Minor | 1.0.0 → 1.1.0 |
| Breaking change in state format or CLI | Major | 1.0.0 → 2.0.0 |

### Release Checklist

- [ ] All 1,030+ tests pass
- [ ] `npm run quality` passes (lint + format + test)
- [ ] CHANGELOG.md updated with new version section
- [ ] Version bumped in package.json
- [ ] `npm pack --dry-run` shows correct files
- [ ] Test `npx get-things-done@latest` in a fresh directory after publish
- [ ] SDK rebuilt and published if types changed

---

## Troubleshooting

### Tests fail after changes

```bash
# Check which specific tests fail
npx vitest run --reporter=verbose 2>&1 | grep "FAIL"

# Run just the failing test file
npx vitest run tests/<failing-file>.test.cjs
```

### "Module not found" errors

All lib modules use CJS (`require`). If you add a new module:
1. Create `lib/your-module.cjs`
2. Add to `bin/gtd-tools.cjs` command registry
3. Write tests in `tests/your-module.test.cjs`

### npm publish fails

```bash
# Check you're logged in
npm whoami

# Check package name availability
npm view get-things-done

# If name taken, update package.json name
```

### Installer doesn't work after publish

```bash
# Test locally before publishing
node bin/install.js --claude --global

# Check bin field in package.json
# "bin": { "get-things-done": "./bin/install.js" }
```

### npm website says “This package does not have a README” (for one version)

npm shows that message when the **published tarball** for that version has **no `README` file** the registry can attach (or the registry has not finished indexing it yet).

**Common causes**

1. **Registry / CDN delay** — Right after `npm publish`, the web UI can lag. Wait a few minutes, hard-refresh the package page, or check the CLI:  
   `npm view @karthikrajkumar.kannan/get-things-done@<version> readme | head`  
   If you see Markdown here, the README is stored; the site may still catch up.

2. **Publish without `README.md` in the pack** — If you run `npm publish` from a **git** checkout, npm packs from the **git index** (committed + staged files). An **uncommitted** or **untracked** `README.md` can be **left out** of the tarball even though it exists on disk. **Fix:** `git add README.md && git commit` before publish, or always run `npm pack --dry-run` and confirm `README.md` appears under “Tarball Contents”.

3. **Wrong directory** — Publishing from a folder that is not the package root (no `README.md` there).

4. **Interrupted publish** — Rare; republish a **new patch version** (npm does not allow overwriting an existing version).

**Before every publish**

```bash
npm pack --dry-run 2>&1 | grep -i readme
# Expect a line like: npm notice 28.5kB README.md
```

This repo lists **`README.md` and `LICENSE` in `package.json` → `files`** so they are always part of the explicit allowlist together with `bin/`, `lib/`, etc.

---

*End of Build and Publish Guide*
