# Get Things Done (GTD) - Low-Level Design Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft

---

## Table of Contents

- [1. Module Specifications](#1-module-specifications)
- [2. CLI Tools Module (gtd-tools.cjs)](#2-cli-tools-module-gtd-toolscjs)
- [3. Installer Module](#3-installer-module)
- [4. Agent Definitions](#4-agent-definitions)
- [5. Workflow Specifications](#5-workflow-specifications)
- [6. Template Engine](#6-template-engine)
- [7. Analysis Cache Module](#7-analysis-cache-module)
- [8. Diff Engine Module](#8-diff-engine-module)
- [9. State Machine Implementation](#9-state-machine-implementation)
- [10. SDK Module](#10-sdk-module)
- [11. Data Structures and Schemas](#11-data-structures-and-schemas)
- [12. Error Handling Specifications](#12-error-handling-specifications)
- [13. Algorithm Details](#13-algorithm-details)
- [14. Forward Pipeline Module Specifications](#14-forward-pipeline-module-specifications)
- [15. Forward Agent Definitions](#15-forward-agent-definitions)
- [16. Sync Module Specifications](#16-sync-module-specifications)

---

## 1. Module Specifications

### 1.1 Module Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│                    bin/install.js                     │
│              (entry point for npx)                   │
└──────────────────────┬──────────────────────────────┘
                       │ imports
         ┌─────────────┼─────────────────┐
         ▼             ▼                 ▼
┌──────────────┐ ┌──────────┐  ┌─────────────────┐
│ lib/config   │ │ lib/ui   │  │ lib/runtime-    │
│              │ │          │  │   detect        │
└──────┬───────┘ └──────────┘  └────────┬────────┘
       │                                │
       ▼                                ▼
┌──────────────┐                ┌─────────────────┐
│ lib/file-ops │                │ lib/installers/  │
│              │                │   claude.cjs     │
└──────────────┘                │   gemini.cjs     │
                                │   copilot.cjs    │
                                │   ...            │
                                └─────────────────┘

┌─────────────────────────────────────────────────────┐
│               bin/gtd-tools.cjs                      │
│           (runtime CLI tools layer)                  │
└──────────────────────┬──────────────────────────────┘
                       │ imports
    ┌──────────────┬───┴───┬──────────────┬──────────┐
    ▼              ▼       ▼              ▼          ▼
┌────────┐  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐
│lib/    │  │lib/    │ │lib/    │ │lib/      │ │lib/    │
│state   │  │config  │ │analysis│ │template  │ │docs    │
└────────┘  └────────┘ └────────┘ └──────────┘ └────────┘

    ┌──────────────┬───────┬──────────────┬──────────┐
    ▼              ▼       ▼              ▼          ▼
┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│lib/        │ │lib/        │ │lib/      │ │lib/drift-    │ │lib/test-     │
│phase       │ │roadmap     │ │deploy    │ │  engine      │ │  runner      │
│(phase mgmt)│ │(roadmap    │ │(local    │ │(drift        │ │(test         │
│            │ │ parsing)   │ │ deploy)  │ │ detection)   │ │ execution)   │
└────────────┘ └────────────┘ └──────────┘ └──────────────┘ └──────────────┘
```

---

## 2. CLI Tools Module (gtd-tools.cjs)

### 2.1 Command Router

```javascript
// bin/gtd-tools.cjs — Main entry point
const COMMANDS = {
  'init':           require('./lib/init'),
  'config-get':     require('./lib/config').get,
  'config-set':     require('./lib/config').set,
  'state':          require('./lib/state'),
  'analysis':       require('./lib/analysis'),
  'template':       require('./lib/template'),
  'doc':            require('./lib/docs'),
  'agent-skills':   require('./lib/agent-skills'),
  'scan-status':    require('./lib/scan-status'),
  'diff-since':     require('./lib/diff-engine'),
  'version':        require('./lib/version'),
  'phase':          require('./lib/phase'),
  'roadmap':        require('./lib/roadmap'),
  'deploy':         require('./lib/deploy'),
  'drift':          require('./lib/drift-engine'),
  'test':           require('./lib/test-runner'),
};

const [command, ...args] = process.argv.slice(2);
if (!COMMANDS[command]) {
  process.stderr.write(`Unknown command: ${command}\n`);
  process.exit(1);
}
COMMANDS[command](args);
```

### 2.2 Init Module (`lib/init.cjs`)

**Purpose:** Load and assemble workflow context for agent orchestration.

```javascript
/**
 * init(workflowName, args) → JSON context string
 *
 * Loads project state, config, analysis cache status, and
 * workflow-specific context into a single JSON payload.
 *
 * @param {string} workflowName - e.g., "create-tdd", "scan-codebase"
 * @param {string[]} args - Additional arguments
 * @returns {string} JSON or @file: reference to temp file
 */
function init(workflowName, args) {
  const projectRoot = findProjectRoot();
  const docsRoot = path.join(projectRoot, '.planning');
  const config = loadConfig(docsRoot);
  const state = loadState(docsRoot);
  const analysisStatus = getAnalysisStatus(docsRoot);
  const codebaseMap = loadCodebaseMap(docsRoot);

  const context = {
    project_root: projectRoot,
    docs_root: docsRoot,
    config,
    state,
    analysis_status: analysisStatus,
    codebase_summary: codebaseMap?.summary || null,
    workflow: workflowName,
    args: parseWorkflowArgs(workflowName, args),
    models: resolveModels(config),
    git: {
      current_commit: getGitCommit(projectRoot),
      branch: getGitBranch(projectRoot),
      has_changes: hasUncommittedChanges(projectRoot),
    },
    timestamp: new Date().toISOString(),
  };

  // If context > 50KB, write to temp file
  const json = JSON.stringify(context, null, 2);
  if (json.length > 50000) {
    const tmpFile = writeTempFile(json);
    process.stdout.write(`@file:${tmpFile}`);
  } else {
    process.stdout.write(json);
  }
}
```

### 2.3 State Module (`lib/state.cjs`)

```javascript
/**
 * State operations for .planning/STATE.md
 *
 * STATE.md format:
 * ---
 * last_scan_commit: "abc1234"
 * last_analysis_commit: "abc1234"
 * pipeline_status: "analyzed"
 * ---
 * # GTD State
 * ## Documents
 * | Document | Status | Version | ...
 */

const STATE_FILE = 'STATE.md';

function loadState(docsRoot) {
  const statePath = path.join(docsRoot, STATE_FILE);
  if (!fs.existsSync(statePath)) return defaultState();

  const content = fs.readFileSync(statePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);
  return {
    ...frontmatter,
    documents: parseDocumentTable(body),
    analysis: parseAnalysisTable(body),
  };
}

function updateState(docsRoot, updates) {
  const current = loadState(docsRoot);
  const merged = deepMerge(current, updates);
  const content = renderState(merged);
  atomicWrite(path.join(docsRoot, STATE_FILE), content);
  return merged;
}

function defaultState() {
  return {
    last_scan_commit: null,
    last_analysis_commit: null,
    pipeline_status: 'empty',
    documents: {},
    analysis: {},
  };
}
```

### 2.4 Config Module (`lib/config.cjs`)

```javascript
/**
 * Configuration management for .planning/config.json
 *
 * Pattern: absent = enabled (following GSD convention)
 * Missing keys default to their enabled/standard values.
 */

const CONFIG_FILE = 'config.json';

const DEFAULTS = {
  scan: {
    exclude_patterns: ['node_modules', 'dist', '.git', '*.lock', 'coverage'],
    include_tests: false,
    max_file_size_kb: 500,
    max_files: 10000,
  },
  analysis: {
    dimensions: ['architecture', 'api', 'data-flow', 'dependencies', 'security', 'performance'],
    depth: 'standard',      // 'shallow' | 'standard' | 'deep'
    language_specific: true,
  },
  documents: {
    format: 'standard',     // 'enterprise' | 'standard' | 'startup' | 'compliance'
    output_dir: '.planning/documents',
    diagram_format: 'mermaid',
    include_code_snippets: true,
    max_snippet_lines: 30,
  },
  workflow: {
    auto_scan_on_create: true,
    require_verification: true,
    require_review: true,
    parallelization: true,
  },
  models: {
    analyzer: 'sonnet',
    writer: 'sonnet',
    verifier: 'haiku',
  },
};

function get(docsRoot, key) {
  const config = loadConfig(docsRoot);
  return getNestedValue(config, key) ?? getNestedValue(DEFAULTS, key);
}

function set(docsRoot, key, value) {
  const config = loadConfig(docsRoot);
  setNestedValue(config, key, value);
  atomicWrite(path.join(docsRoot, CONFIG_FILE), JSON.stringify(config, null, 2));
}
```

### 2.5 Analysis Cache Module (`lib/analysis.cjs`)

```javascript
/**
 * Analysis cache management.
 *
 * Each analysis dimension writes to:
 *   .planning/analysis/<DIMENSION>.md
 *
 * Frontmatter includes:
 * ---
 * dimension: architecture
 * commit: abc1234
 * timestamp: 2026-04-10T10:00:00Z
 * files_analyzed: 145
 * ---
 */

function getAnalysisStatus(docsRoot) {
  const analysisDir = path.join(docsRoot, 'analysis');
  if (!fs.existsSync(analysisDir)) return { dimensions: {}, complete: false };

  const dimensions = {};
  const currentCommit = getGitCommit(path.dirname(docsRoot));

  for (const file of fs.readdirSync(analysisDir)) {
    if (!file.endsWith('.md') || file === 'FILE-INDEX.json') continue;
    const content = fs.readFileSync(path.join(analysisDir, file), 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    const name = frontmatter.dimension || path.basename(file, '.md');

    dimensions[name] = {
      status: 'complete',
      commit: frontmatter.commit,
      stale: frontmatter.commit !== currentCommit,
      timestamp: frontmatter.timestamp,
      files_analyzed: frontmatter.files_analyzed || 0,
    };
  }

  return { dimensions, complete: Object.keys(dimensions).length >= 4 };
}

function isStale(docsRoot, dimension) {
  const status = getAnalysisStatus(docsRoot);
  const dim = status.dimensions[dimension];
  return !dim || dim.stale;
}

function getStaleDimensions(docsRoot) {
  const status = getAnalysisStatus(docsRoot);
  return Object.entries(status.dimensions)
    .filter(([_, v]) => v.stale)
    .map(([k, _]) => k);
}
```

### 2.6 Template Module (`lib/template.cjs`)

```javascript
/**
 * Template operations for document generation.
 *
 * Templates use a simple variable substitution system:
 *   {{variable_name}} — replaced with context value
 *   {{#section_name}} ... {{/section_name}} — conditional sections
 *   {{@file:path}} — inline file content
 */

function fill(templateType, variables) {
  const templatePath = resolveTemplate(templateType, variables.format);
  const template = fs.readFileSync(templatePath, 'utf8');

  let result = template;

  // Replace simple variables
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });

  // Process conditional sections
  result = result.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (match, key, content) => {
      return variables[key] ? content : '';
    }
  );

  // Process file includes
  result = result.replace(/\{\{@file:(.*?)\}\}/g, (match, filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return `<!-- File not found: ${filePath} -->`;
    }
  });

  return result;
}

function resolveTemplate(type, format) {
  const formatDir = format || 'standard';
  const candidates = [
    path.join(TEMPLATES_DIR, type, `${formatDir}.md`),
    path.join(TEMPLATES_DIR, type, 'standard.md'),
    path.join(TEMPLATES_DIR, type, 'default.md'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Template not found for type=${type}, format=${formatDir}`);
}
```

---

## 3. Installer Module

### 3.1 Install Flow

```javascript
// bin/install.js

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Step 1: Detect available runtimes
  const runtimes = detectInstalledRuntimes();

  // Step 2: Select runtime(s) — interactive or via flags
  const selectedRuntimes = args.runtime
    ? [args.runtime]
    : await promptRuntimeSelection(runtimes);

  // Step 3: Select location — global or local
  const location = args.global ? 'global'
    : args.local ? 'local'
    : await promptLocation();

  // Step 4: Select document format preference
  const format = args.format || await promptFormat();

  // Step 5: Install for each selected runtime
  for (const runtime of selectedRuntimes) {
    const installer = getInstaller(runtime);
    const installPath = installer.getInstallPath(location);

    console.log(`Installing GTD for ${runtime} at ${installPath}...`);

    // Copy framework files
    installer.copyAgents(installPath);
    installer.copyWorkflows(installPath);
    installer.copyCommands(installPath);
    installer.copyReferences(installPath);
    installer.copyTemplates(installPath);
    installer.copyBinTools(installPath);
    installer.copyContexts(installPath);

    // Generate initial config
    installer.generateConfig(installPath, { format });

    // Setup hooks if applicable
    installer.setupHooks(installPath);

    // Verify installation
    const health = installer.verify(installPath);
    if (health.ok) {
      console.log(`  ✓ ${runtime} installation complete`);
    } else {
      console.log(`  ✗ ${runtime} installation has issues: ${health.errors.join(', ')}`);
    }
  }
}
```

### 3.2 Runtime-Specific Installers

```javascript
// lib/installers/claude.cjs

const CLAUDE_PATHS = {
  global: path.join(homedir(), '.claude'),
  local: '.claude',
};

class ClaudeInstaller {
  getInstallPath(location) {
    return CLAUDE_PATHS[location];
  }

  copyCommands(basePath) {
    // Claude Code 2.1.88+ uses skills format
    const skillsDir = path.join(basePath, 'skills');
    for (const cmd of listCommands()) {
      const skillDir = path.join(skillsDir, `gtd-${cmd.name}`);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.copyFileSync(
        path.join(SRC_DIR, 'commands', 'gtd', `${cmd.name}.md`),
        path.join(skillDir, 'SKILL.md')
      );
    }
  }

  copyAgents(basePath) {
    const agentsDir = path.join(basePath, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    for (const agentFile of listAgents()) {
      fs.copyFileSync(
        path.join(SRC_DIR, 'agents', agentFile),
        path.join(agentsDir, agentFile)
      );
    }
  }

  // ... copyWorkflows, copyReferences, etc.
}
```

---

## 4. Agent Definitions

### 4.1 Codebase Mapper Agent

```markdown
---
name: gtd-codebase-mapper
description: Scans and indexes project structure, languages, frameworks, and entry points
tools: [Read, Bash, Grep, Glob, Write]
model_tier: sonnet
color: "#10B981"
---

<purpose>
Build a comprehensive map of the codebase covering structure, languages,
frameworks, entry points, infrastructure, and module boundaries.
</purpose>

<process>
1. Run file discovery:
   - Glob for all source files respecting .gitignore
   - Count files per directory
   - Identify language distribution

2. Detect frameworks:
   - Check package.json for React/Next.js/Express/etc.
   - Check pyproject.toml/setup.py for Django/FastAPI/etc.
   - Check go.mod for Go frameworks
   - Check Cargo.toml for Rust frameworks
   - Identify build tools (webpack, vite, turbopack, etc.)

3. Find entry points:
   - "main" field in package.json
   - index.ts/js files at package roots
   - app.py / main.py / manage.py patterns
   - main.go / cmd/ directory
   - Dockerfile ENTRYPOINT/CMD

4. Detect infrastructure:
   - Docker: Dockerfile, docker-compose.yml
   - Kubernetes: k8s/, charts/, *.yaml with apiVersion
   - Terraform: *.tf files
   - CI/CD: .github/workflows/, .gitlab-ci.yml, Jenkinsfile
   - Cloud: serverless.yml, cdk.json, sam template

5. Map module boundaries:
   - Top-level directories as modules
   - Package/workspace configurations
   - Import graph (top-level only)

6. Write outputs:
   - CODEBASE-MAP.md (human-readable summary)
   - analysis/FILE-INDEX.json (machine-readable index)
</process>

<output_format>
Write CODEBASE-MAP.md with these sections:
- Project Identity (name, languages, frameworks, build, runtime)
- Architecture Fingerprint (pattern, API style, DB, auth, deploy)
- Module Map (directory → purpose → file count)
- Entry Points (file → type)
- Infrastructure (tool → config file → purpose)
- External Dependencies (name → version → purpose)
- Key Configuration Files (file → purpose)
</output_format>
```

### 4.2 Architecture Analyzer Agent

```markdown
---
name: gtd-architecture-analyzer
description: Analyzes architectural patterns, component boundaries, and layer structure
tools: [Read, Bash, Grep, Glob]
model_tier: sonnet
color: "#3B82F6"
---

<purpose>
Perform deep architectural analysis: identify patterns (MVC, microservices,
event-driven, etc.), map component boundaries, trace layer structure,
and document inter-component communication.
</purpose>

<inputs>
- .planning/CODEBASE-MAP.md
- .planning/config.json
- Source code files (read as needed)
</inputs>

<process>
1. Read CODEBASE-MAP.md for project overview

2. Identify architectural pattern:
   - Monolith vs microservices vs modular monolith
   - MVC vs MVVM vs Clean Architecture vs Hexagonal
   - Event-driven vs request-response vs CQRS
   - Server-rendered vs SPA vs SSR+hydration

3. Map component boundaries:
   - For each major directory/module:
     - Identify responsibility (UI, business logic, data access, infra)
     - Trace inbound dependencies (who calls this?)
     - Trace outbound dependencies (what does this call?)
     - Classify: core domain, supporting, generic

4. Trace layer structure:
   - Presentation layer (routes, controllers, pages)
   - Business/domain layer (services, models, entities)
   - Data access layer (repositories, ORM, queries)
   - Infrastructure layer (config, logging, middleware)

5. Document communication patterns:
   - Synchronous: HTTP, gRPC, function calls
   - Asynchronous: message queues, events, webhooks
   - Data sharing: shared DB, API, file system

6. Identify cross-cutting concerns:
   - Authentication/authorization flow
   - Error handling strategy
   - Logging/monitoring approach
   - Configuration management

7. Write ARCHITECTURE-ANALYSIS.md
</process>
```

### 4.3 TDD Writer Agent

```markdown
---
name: gtd-tdd-writer
description: Generates Technical Design Documents from analysis artifacts
tools: [Read, Write, Bash, Grep, Glob]
model_tier: sonnet
color: "#8B5CF6"
---

<purpose>
Generate a professional Technical Design Document by synthesizing
analysis artifacts into a structured, accurate, and comprehensive document.
</purpose>

<inputs>
- .planning/analysis/ARCHITECTURE-ANALYSIS.md
- .planning/analysis/PATTERN-ANALYSIS.md
- .planning/analysis/DEPENDENCY-GRAPH.md
- .planning/CODEBASE-MAP.md
- Template: templates/tdd/<format>.md
- config.json for preferences
</inputs>

<process>
1. Load and read all analysis artifacts
2. Load document template for configured format
3. For each template section:
   a. Identify which analysis artifacts provide data
   b. Read relevant source files for accuracy (up to 20 files)
   c. Generate section content with:
      - Clear technical prose
      - Mermaid diagrams where appropriate
      - Code snippets (respecting max_snippet_lines config)
      - Cross-references to other sections
   d. Include rationale and trade-off discussion
4. Generate Table of Contents
5. Add metadata header (version, date, project, commit)
6. Write to documents/TDD-DRAFT.md
</process>

<quality_rules>
- Every claim must trace to actual code (file path + description)
- Diagrams must reflect actual structure (not aspirational)
- Use present tense for current state, past tense for history
- Include "Limitations and Known Issues" section
- Mark any sections with low confidence for reviewer attention
</quality_rules>
```

### 4.4 Accuracy Verifier Agent

```markdown
---
name: gtd-accuracy-verifier
description: Cross-references document claims against actual codebase
tools: [Read, Bash, Grep, Glob]
model_tier: haiku
color: "#EF4444"
---

<purpose>
Verify that a generated document accurately reflects the codebase.
Check file paths, code references, configuration values, API endpoints,
and structural claims.
</purpose>

<process>
1. Read the draft document
2. Extract all verifiable claims:
   - File paths mentioned → check existence
   - Code snippets → compare with actual source
   - Configuration values → check against config files
   - API endpoints → grep for route definitions
   - Dependency versions → check package manifests
   - Architecture claims → verify against file structure
   - Diagram elements → verify components exist

3. For each claim:
   - Status: VERIFIED | INACCURATE | STALE | UNVERIFIABLE
   - If INACCURATE: note what the actual value/state is
   - If STALE: note what changed

4. Produce VERIFICATION-REPORT.md:
   - Summary: X verified, Y inaccurate, Z unverifiable
   - Per-section breakdown
   - Specific corrections needed
   - Confidence score (% verified)
</process>
```

---

## 5. Workflow Specifications

### 5.1 Scan Codebase Workflow

```markdown
<!-- workflows/scan-codebase.md -->
<purpose>
Map the project structure for subsequent analysis and document generation.
</purpose>

<process>
<step name="initialize">
INIT=$(node gtd-tools.cjs init scan-codebase "$ARGUMENTS")
Parse: project_root, docs_root, existing_map, config
</step>

<step name="check_existing">
If existing_map exists AND git commit unchanged:
  → "Codebase map is current. Use --force to re-scan."
  → EXIT
</step>

<step name="create_docs_dir">
mkdir -p .planning/analysis
</step>

<step name="spawn_mapper">
Spawn gtd-codebase-mapper agent with:
  - project_root
  - config.scan settings
  - Output target: .planning/CODEBASE-MAP.md
</step>

<step name="update_state">
node gtd-tools.cjs state update last_scan_commit $(git rev-parse HEAD)
node gtd-tools.cjs state update pipeline_status scanned
</step>

<step name="report">
Display scan summary:
  - Files indexed: N
  - Languages detected: [list]
  - Framework fingerprint: [name]
  - "Run /gtd-analyze for deep analysis, or /gtd-create-* to generate documents."
</step>
</process>
```

### 5.2 Generate Document Workflow

```markdown
<!-- workflows/generate-document.md -->
<purpose>
Generate a specific document type through the full pipeline:
check analysis → run analyzers → draft → verify → present for review.
</purpose>

<process>
<step name="initialize">
INIT=$(node gtd-tools.cjs init generate-document "$DOC_TYPE" "$ARGUMENTS")
Parse: doc_type, format, required_analyses, auto_mode, models
</step>

<step name="check_prerequisites">
If no CODEBASE-MAP.md:
  → "No codebase map found. Running /gtd-scan first..."
  → Execute scan-codebase workflow
  → Continue

Check required analysis dimensions for this doc type:
  stale = $(node gtd-tools.cjs analysis stale-for "$DOC_TYPE")
  If stale dimensions exist:
    → Run targeted analysis for stale dimensions only
</step>

<step name="run_analysis" if="stale_dimensions">
For each stale dimension (PARALLEL if config.workflow.parallelization):
  Spawn appropriate analyzer agent:
    - architecture → gtd-architecture-analyzer
    - api → gtd-api-extractor
    - data-flow → gtd-data-flow-tracer
    - dependencies → gtd-dependency-analyzer
    - security → gtd-security-scanner
    - performance → gtd-performance-profiler

  Each agent writes to .planning/analysis/<DIMENSION>.md
</step>

<step name="draft_document">
Spawn gtd-<doc_type>-writer agent with:
  - All relevant analysis artifacts
  - CODEBASE-MAP.md
  - Template for configured format
  - config.json preferences

Agent writes: .planning/drafts/<DOC_TYPE>-DRAFT.md
</step>

<step name="verify_accuracy" if="config.workflow.require_verification">
Spawn gtd-accuracy-verifier agent with:
  - Draft document
  - Access to source code for cross-referencing

Agent writes: .planning/verification/<DOC_TYPE>-VERIFICATION.md
</step>

<step name="present_for_review" if="!auto_mode">
Display to user:
  - Draft summary (section count, word count)
  - Verification results (X verified, Y flagged)
  - Flagged sections requiring attention

Await user response:
  - "approved" → proceed to finalize
  - Feedback → apply revisions and re-present
  - "cancel" → save draft, exit
</step>

<step name="finalize">
Move draft to final:
  .planning/documents/<DOC_TYPE>.md

Add metadata header:
  - Generated by: GTD v2.0.0
  - Date: <timestamp>
  - Commit: <git hash>
  - Verification: <pass rate>%

Update STATE.md:
  node gtd-tools.cjs state update "documents.<doc_type>.status" "final"
  node gtd-tools.cjs state update "documents.<doc_type>.version" "1.0"
  node gtd-tools.cjs state update "documents.<doc_type>.commit" "$(git rev-parse HEAD)"
</step>
</process>
```

### 5.3 Incremental Update Workflow

```markdown
<!-- workflows/incremental-update.md -->
<purpose>
Update existing documents based on code changes since last generation.
Only re-analyze and re-write affected sections.
</purpose>

<process>
<step name="initialize">
Parse: since_commit (default: last doc generation commit), target_docs
</step>

<step name="diff_analysis">
changed_files = git diff --name-only $since_commit..HEAD

For each changed file:
  - Classify: source, config, infra, test, docs
  - Map to affected analysis dimensions
  - Map to affected document sections
</step>

<step name="targeted_analysis">
For each affected analysis dimension:
  - Read existing analysis
  - Re-analyze only changed files within that dimension
  - Merge new findings with existing analysis
  - Update analysis artifact with new commit hash
</step>

<step name="section_patching">
For each affected document:
  - Read current document
  - Identify sections affected by changes
  - Spawn writer agent with:
    - Current document
    - Updated analysis for affected sections
    - Changed files list
    - Instruction: "Update only sections X, Y, Z"
  - Writer produces patched version
</step>

<step name="re_verify">
Spawn verifier on patched sections only
</step>

<step name="present_diff">
Show user:
  - Which documents were updated
  - Which sections changed
  - Diff view of changes
  - Verification results for changed sections
</step>
</process>
```

---

## 6. Template Engine

### 6.1 Template Structure (TDD Example)

```markdown
<!-- templates/tdd/enterprise.md -->
---
type: tdd
format: enterprise
sections: 15
---

# Technical Design Document: {{project_name}}

**Version:** {{doc_version}}
**Date:** {{generation_date}}
**Commit:** {{git_commit}}
**Generated by:** GTD v{{gtd_version}}

---

## 1. Executive Summary
{{tdd_executive_summary}}

## 2. System Context
{{tdd_system_context}}

## 3. Architecture Overview
{{tdd_architecture_overview}}

{{#has_diagrams}}
### Architecture Diagram
{{tdd_architecture_diagram}}
{{/has_diagrams}}

## 4. Component Design
{{tdd_component_design}}

## 5. Data Model
{{tdd_data_model}}

## 6. API Design
{{#has_api}}
{{tdd_api_design}}
{{/has_api}}

## 7. Security Design
{{tdd_security_design}}

## 8. Performance Considerations
{{tdd_performance}}

## 9. Deployment Architecture
{{tdd_deployment}}

## 10. Dependencies
{{tdd_dependencies}}

## 11. Error Handling
{{tdd_error_handling}}

## 12. Monitoring and Observability
{{tdd_monitoring}}

## 13. Testing Strategy
{{tdd_testing}}

## 14. Limitations and Known Issues
{{tdd_limitations}}

## 15. Appendix
{{tdd_appendix}}
```

### 6.2 Template Format Variants

| Format | Sections | Depth | Audience |
|--------|----------|-------|----------|
| `enterprise` | 15 sections | Deep technical detail, compliance focus | Architecture review boards, auditors |
| `standard` | 10 sections | Balanced detail | Engineering teams |
| `startup` | 7 sections | Concise, action-oriented | Small teams, rapid iteration |
| `compliance` | 18 sections | SOC2/ISO focus, risk analysis | Compliance teams, external auditors |

---

## 7. Analysis Cache Module

### 7.1 Cache Key Algorithm

```javascript
/**
 * Analysis cache invalidation algorithm.
 *
 * Cache is VALID when:
 *   1. Analysis file exists for dimension
 *   2. Stored commit matches current HEAD
 *   3. No files in the dimension's scope have changed
 *
 * Cache is STALE when:
 *   1. HEAD has moved since analysis was written
 *   2. Changed files intersect with dimension's file scope
 *
 * Dimension file scopes:
 *   architecture: all source files
 *   api: route files, controller files, handler files
 *   data-flow: model files, service files, middleware
 *   dependencies: package manifests, lock files
 *   security: auth files, middleware, config
 *   performance: all source files (conservative)
 */

function isCacheValid(docsRoot, dimension) {
  const analysisFile = path.join(docsRoot, 'analysis', `${dimension}.md`);
  if (!fs.existsSync(analysisFile)) return false;

  const { frontmatter } = parseFrontmatter(fs.readFileSync(analysisFile, 'utf8'));
  const currentCommit = getGitCommit(path.dirname(docsRoot));

  if (frontmatter.commit === currentCommit) return true;

  // Check if changes affect this dimension
  const changedFiles = getChangedFiles(frontmatter.commit, currentCommit);
  const scopePatterns = getDimensionScope(dimension);
  return !changedFiles.some(f => matchesAnyPattern(f, scopePatterns));
}
```

---

## 8. Diff Engine Module

### 8.1 Change Impact Mapping

```javascript
/**
 * Maps file changes to affected documents and sections.
 *
 * Change → Dimension → Document → Section mapping.
 */

const IMPACT_MAP = {
  // File pattern → affected dimensions
  'src/**/*.{ts,js,py,go,rs}': ['architecture', 'data-flow', 'performance'],
  'src/**/route*': ['api'],
  'src/**/controller*': ['api'],
  'src/**/handler*': ['api'],
  'src/**/model*': ['data-flow', 'architecture'],
  'src/**/auth*': ['security'],
  'src/**/middleware*': ['security', 'data-flow'],
  'package.json': ['dependencies'],
  'go.mod': ['dependencies'],
  'Cargo.toml': ['dependencies'],
  'Dockerfile': ['architecture', 'performance'],
  'docker-compose*': ['architecture'],
  'k8s/**': ['architecture', 'performance'],
  '*.tf': ['architecture'],
  '.github/workflows/*': ['architecture'],
};

// Dimension → Document section mapping
const DIMENSION_TO_SECTION = {
  architecture: {
    tdd: ['architecture-overview', 'component-design', 'deployment'],
    hld: ['architecture-overview', 'subsystems', 'deployment'],
    lld: ['module-specifications', 'component-details'],
    'system-design': ['architecture', 'components', 'deployment'],
  },
  api: {
    tdd: ['api-design'],
    hld: ['integration-points'],
    lld: ['api-specifications', 'endpoint-details'],
    'api-docs': ['*'],  // full regeneration
  },
  // ... more mappings
};
```

---

## 9. State Machine Implementation

### 9.1 Backward Pipeline (Code to Docs)

```javascript
/**
 * Backward pipeline state transitions.
 *
 * EMPTY → SCANNED → ANALYZED → DRAFTING → REVIEW → FINALIZED → STALE
 *
 * Valid transitions:
 *   EMPTY → SCANNED         (/gtd-scan)
 *   SCANNED → ANALYZED      (/gtd-analyze)
 *   SCANNED → DRAFTING      (/gtd-create-* with auto-analyze)
 *   ANALYZED → DRAFTING     (/gtd-create-*)
 *   DRAFTING → REVIEW       (draft complete)
 *   REVIEW → FINALIZED      (user approves)
 *   REVIEW → DRAFTING       (user requests changes)
 *   FINALIZED → STALE       (code changes detected)
 *   STALE → ANALYZED        (/gtd-update)
 *   ANY → SCANNED           (/gtd-scan --force)
 */

const BACKWARD_TRANSITIONS = {
  empty:     ['scanned'],
  scanned:   ['analyzed', 'drafting'],
  analyzed:  ['drafting'],
  drafting:  ['review'],
  review:    ['finalized', 'drafting'],
  finalized: ['stale'],
  stale:     ['analyzed', 'scanned'],
};
```

### 9.2 Forward Pipeline (Docs/Plans to Code)

```javascript
/**
 * Forward pipeline state transitions.
 *
 * EMPTY → RESEARCHED → PLANNED → EXECUTING → DEPLOYED → TESTED → VERIFIED
 *
 * Valid transitions:
 *   EMPTY → RESEARCHED       (requirements/research gathered)
 *   RESEARCHED → PLANNED     (execution plan created)
 *   PLANNED → EXECUTING      (gtd-executor begins work)
 *   EXECUTING → DEPLOYED     (local deploy succeeds)
 *   DEPLOYED → TESTED        (test suite passes)
 *   TESTED → VERIFIED        (drift check confirms spec alignment)
 *   EXECUTING → PLANNED      (execution failed, re-plan)
 *   DEPLOYED → EXECUTING     (deploy failed, fix code)
 *   TESTED → EXECUTING       (tests failed, fix code)
 *   VERIFIED → EMPTY         (phase complete, next phase)
 */

const FORWARD_TRANSITIONS = {
  empty:      ['researched'],
  researched: ['planned'],
  planned:    ['executing'],
  executing:  ['deployed', 'planned'],
  deployed:   ['tested', 'executing'],
  tested:     ['verified', 'executing'],
  verified:   ['empty'],
};
```

### 9.3 Sync Pipeline (Drift Detection and Reconciliation)

```javascript
/**
 * Sync pipeline state transitions.
 *
 * SYNCED → DRIFTED → RECONCILING → SYNCED
 *
 * Valid transitions:
 *   SYNCED → DRIFTED          (drift detected between spec and code)
 *   DRIFTED → RECONCILING     (user initiates reconciliation)
 *   RECONCILING → SYNCED      (reconciliation complete, approved)
 *   RECONCILING → DRIFTED     (reconciliation rejected by user)
 */

const SYNC_TRANSITIONS = {
  synced:       ['drifted'],
  drifted:      ['reconciling'],
  reconciling:  ['synced', 'drifted'],
};
```

### 9.4 Combined State Tracker

```javascript
/**
 * The combined state tracks both pipelines independently.
 *
 * State shape:
 *   { backward: <backward_state>, forward: <forward_state>, sync: <sync_state> }
 *
 * Each pipeline transitions independently. The sync pipeline
 * monitors alignment between the other two.
 */

function createCombinedState() {
  return {
    backward: 'empty',
    forward: 'empty',
    sync: 'synced',
  };
}

function transitionPipeline(combinedState, pipeline, newState) {
  const transitionMap = {
    backward: BACKWARD_TRANSITIONS,
    forward: FORWARD_TRANSITIONS,
    sync: SYNC_TRANSITIONS,
  };

  const valid = transitionMap[pipeline];
  const current = combinedState[pipeline];

  if (!valid[current]?.includes(newState)) {
    throw new Error(
      `Invalid ${pipeline} transition: ${current} → ${newState}. ` +
      `Valid: ${valid[current]?.join(', ')}`
    );
  }

  return { ...combinedState, [pipeline]: newState };
}
```

---

## 10. SDK Module

### 10.1 Public API

```typescript
// sdk/src/index.ts

export interface GTDOptions {
  projectDir: string;
  model?: string;
  maxBudgetUsd?: number;
  maxTurns?: number;
  autoMode?: boolean;
  format?: 'enterprise' | 'standard' | 'startup' | 'compliance';
}

export interface DocumentResult {
  success: boolean;
  documentType: string;
  outputPath: string;
  version: string;
  verificationScore: number;
  durationMs: number;
  totalCostUsd: number;
  error?: { messages: string[] };
}

export interface StalenessReport {
  staleDocuments: Array<{
    type: string;
    lastCommit: string;
    currentCommit: string;
    changedFiles: string[];
    affectedSections: string[];
  }>;
}

export class GTD {
  constructor(options: GTDOptions);

  // Core operations
  async scan(): Promise<ScanResult>;
  async analyze(dimensions?: string[]): Promise<AnalysisResult>;
  async generateDocument(type: string): Promise<DocumentResult>;
  async generateAll(): Promise<DocumentResult[]>;
  async updateDocument(type: string, since?: string): Promise<DocumentResult>;
  async updateAll(since?: string): Promise<DocumentResult[]>;

  // Query operations
  async checkStaleness(): Promise<StalenessReport>;
  async getDocumentStatus(): Promise<Record<string, DocumentStatus>>;
  async getAnalysisStatus(): Promise<Record<string, AnalysisStatus>>;
}
```

---

## 11. Data Structures and Schemas

### 11.1 FILE-INDEX.json Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "commit": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "stats": {
      "type": "object",
      "properties": {
        "total_files": { "type": "integer" },
        "total_lines": { "type": "integer" },
        "languages": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "files": { "type": "integer" },
              "lines": { "type": "integer" },
              "percentage": { "type": "number" }
            }
          }
        }
      }
    },
    "modules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "purpose": { "type": "string" },
          "file_count": { "type": "integer" },
          "primary_language": { "type": "string" },
          "entry_points": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "entry_points": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "type": { "type": "string", "enum": ["web", "api", "cli", "worker", "test"] }
        }
      }
    }
  }
}
```

---

## 12. Error Handling Specifications

### 12.1 Error Categories and Recovery

| Error Code | Category | Description | Recovery |
|------------|----------|-------------|----------|
| `GTD-E001` | SCAN | File system permission denied | Report file, skip, continue scan |
| `GTD-E002` | SCAN | Max file count exceeded | Warn user, suggest exclude patterns |
| `GTD-E003` | ANALYSIS | Agent timeout | Retry once with reduced file count |
| `GTD-E004` | ANALYSIS | Unsupported language | Skip analysis dimension, note gap |
| `GTD-E005` | WRITE | Template not found | Fall back to standard template |
| `GTD-E006` | WRITE | Analysis artifact missing | Run targeted analysis first |
| `GTD-E007` | VERIFY | Source file changed during verify | Re-read and re-verify |
| `GTD-E008` | STATE | State file corrupted | Rebuild from analysis artifacts |
| `GTD-E009` | GIT | Git not available | Proceed without versioning |
| `GTD-E010` | CONFIG | Invalid config value | Use default, warn user |
| `GTD-E011` | EXECUTE | Execution agent produced code that doesn't compile | Roll back commit, report compilation errors to planner for re-plan |
| `GTD-E012` | DEPLOY | Local deploy failed (port in use, build error) | Kill conflicting process or report build error, retry once |
| `GTD-E013` | TEST | Test suite failure during verification | Map failures to source, report to executor for targeted fix |
| `GTD-E014` | DRIFT | Drift detection found unresolvable conflict | Generate DRIFT-REPORT.md, escalate to user for manual resolution |
| `GTD-E015` | SYNC | Reconciliation rejected by user | Revert reconciliation changes, return to drifted state |

### 12.2 Atomic Write Pattern

```javascript
/**
 * All file writes use atomic pattern to prevent corruption.
 *
 * Write to temp file → rename to target (atomic on same filesystem).
 */
function atomicWrite(targetPath, content) {
  const tmpPath = targetPath + '.tmp.' + process.pid;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    // Clean up temp file on failure
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}
```

---

## 13. Algorithm Details

### 13.1 Framework Fingerprinting Algorithm

```
Input: FILE-INDEX.json (list of all files)
Output: Framework identification with confidence score

1. Check package manifests:
   - package.json → scan dependencies for known frameworks
   - pyproject.toml → scan dependencies
   - go.mod → scan require directives
   - Cargo.toml → scan dependencies

2. Check directory conventions:
   - app/routes/ + app/models/ → Rails pattern
   - src/app/ + next.config.* → Next.js pattern
   - src/pages/ + gatsby-config.* → Gatsby pattern
   - cmd/ + internal/ + pkg/ → Go service pattern

3. Check configuration files:
   - angular.json → Angular
   - vue.config.js → Vue
   - nuxt.config.* → Nuxt
   - svelte.config.* → SvelteKit
   - tailwind.config.* → Tailwind CSS
   - prisma/schema.prisma → Prisma ORM

4. Score each detection:
   - Manifest match: 90% confidence
   - Directory pattern match: 70% confidence
   - Config file match: 80% confidence
   - Multiple signals: combine (max 99%)

5. Return top framework(s) above 60% confidence threshold
```

### 13.2 Section Impact Scoring

```
Input: Changed files list, document type
Output: List of sections with impact scores

For each changed file:
  1. Classify file by type (route, model, service, config, infra, test)
  2. Look up IMPACT_MAP for affected dimensions
  3. Look up DIMENSION_TO_SECTION for affected document sections
  4. Accumulate impact score per section:
     - Source file change in section's scope: +3
     - Config change affecting section: +2
     - Test change: +1
     - Indirect dependency change: +1

Sort sections by impact score descending
Return sections where score >= threshold (default: 2)
```

---

## 14. Forward Pipeline Module Specifications

### 14.1 Phase Management Module (`lib/phase.cjs`)

```javascript
/**
 * Phase directory management for the forward pipeline.
 *
 * Phases use decimal numbering: 1.0, 1.1, 2.0, 2.1, etc.
 * Each phase maps to a directory under .planning/phases/<phase_number>/
 *
 * Responsibilities:
 *   - Create and manage phase directories
 *   - Maintain decimal numbering scheme (major.minor)
 *   - Index plans within each phase
 *   - Group phases into waves for parallel execution
 */

const PHASES_DIR = 'phases';

function createPhase(docsRoot, phaseNumber, metadata) {
  const phaseDir = path.join(docsRoot, PHASES_DIR, String(phaseNumber));
  fs.mkdirSync(phaseDir, { recursive: true });

  const phaseMeta = {
    number: phaseNumber,
    title: metadata.title,
    status: 'planned',
    wave: metadata.wave || Math.floor(phaseNumber),
    created: new Date().toISOString(),
    plans: [],
  };

  atomicWrite(
    path.join(phaseDir, 'PHASE.json'),
    JSON.stringify(phaseMeta, null, 2)
  );
  return phaseMeta;
}

function listPhases(docsRoot) {
  const phasesDir = path.join(docsRoot, PHASES_DIR);
  if (!fs.existsSync(phasesDir)) return [];

  return fs.readdirSync(phasesDir)
    .filter(d => fs.statSync(path.join(phasesDir, d)).isDirectory())
    .map(d => loadPhase(docsRoot, d))
    .sort((a, b) => a.number - b.number);
}

function indexPlans(docsRoot, phaseNumber) {
  const phaseDir = path.join(docsRoot, PHASES_DIR, String(phaseNumber));
  const plans = fs.readdirSync(phaseDir)
    .filter(f => f.startsWith('PLAN-') && f.endsWith('.md'))
    .map(f => parsePlanFrontmatter(path.join(phaseDir, f)));
  return plans;
}

function getWaveGroup(docsRoot, waveNumber) {
  return listPhases(docsRoot).filter(p => p.wave === waveNumber);
}
```

### 14.2 Roadmap Parsing Module (`lib/roadmap.cjs`)

```javascript
/**
 * ROADMAP.md parsing and progress tracking.
 *
 * Parses a structured ROADMAP.md file to extract phases,
 * milestones, and tasks. Tracks completion progress.
 *
 * Expected ROADMAP.md format:
 *   ## Phase 1.0: <Title>
 *   - [ ] Task description
 *   - [x] Completed task
 *   ### Milestone: <name>
 *   - [ ] Milestone task
 */

function parseRoadmap(roadmapPath) {
  const content = fs.readFileSync(roadmapPath, 'utf8');
  const phases = [];
  let currentPhase = null;
  let currentMilestone = null;

  for (const line of content.split('\n')) {
    const phaseMatch = line.match(/^##\s+Phase\s+([\d.]+):\s*(.+)/);
    if (phaseMatch) {
      currentPhase = {
        number: parseFloat(phaseMatch[1]),
        title: phaseMatch[2].trim(),
        milestones: [],
        tasks: [],
      };
      phases.push(currentPhase);
      currentMilestone = null;
      continue;
    }

    const milestoneMatch = line.match(/^###\s+Milestone:\s*(.+)/);
    if (milestoneMatch && currentPhase) {
      currentMilestone = { name: milestoneMatch[1].trim(), tasks: [] };
      currentPhase.milestones.push(currentMilestone);
      continue;
    }

    const taskMatch = line.match(/^-\s+\[([ x])\]\s+(.+)/);
    if (taskMatch && currentPhase) {
      const task = { done: taskMatch[1] === 'x', description: taskMatch[2].trim() };
      if (currentMilestone) {
        currentMilestone.tasks.push(task);
      } else {
        currentPhase.tasks.push(task);
      }
    }
  }

  return phases;
}

function extractPhases(roadmapPath) {
  return parseRoadmap(roadmapPath).map(p => ({
    number: p.number,
    title: p.title,
    taskCount: countTasks(p),
  }));
}

function trackProgress(roadmapPath) {
  const phases = parseRoadmap(roadmapPath);
  return phases.map(p => {
    const total = countTasks(p);
    const done = countDoneTasks(p);
    return {
      phase: p.number,
      title: p.title,
      total,
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

function countTasks(phase) {
  const direct = phase.tasks.length;
  const milestone = phase.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  return direct + milestone;
}

function countDoneTasks(phase) {
  const direct = phase.tasks.filter(t => t.done).length;
  const milestone = phase.milestones.reduce(
    (sum, m) => sum + m.tasks.filter(t => t.done).length, 0
  );
  return direct + milestone;
}
```

### 14.3 Local Deployment Module (`lib/deploy.cjs`)

```javascript
/**
 * Local deployment management for the forward pipeline.
 *
 * Detects project type and starts local server.
 * Supports Docker, npm, and Python deployments.
 * Includes health check polling and port management.
 */

const DEPLOY_STRATEGIES = [
  { name: 'docker-compose', detect: () => fileExists('docker-compose.yml') || fileExists('docker-compose.yaml') },
  { name: 'dockerfile',     detect: () => fileExists('Dockerfile') },
  { name: 'npm-start',      detect: () => hasScript('package.json', 'start') },
  { name: 'npm-dev',        detect: () => hasScript('package.json', 'dev') },
  { name: 'python-run',     detect: () => fileExists('manage.py') || fileExists('app.py') || fileExists('main.py') },
];

function detectDeployMethod(projectRoot) {
  for (const strategy of DEPLOY_STRATEGIES) {
    if (strategy.detect()) {
      return strategy.name;
    }
  }
  return null;
}

function deploy(projectRoot, options = {}) {
  const method = options.method || detectDeployMethod(projectRoot);
  if (!method) throw new Error('GTD-E012: No deploy method detected');

  const port = options.port || findAvailablePort(3000);

  const runners = {
    'docker-compose': () => execSync('docker compose up -d --build', { cwd: projectRoot }),
    'dockerfile':     () => {
      execSync('docker build -t gtd-local .', { cwd: projectRoot });
      execSync(`docker run -d -p ${port}:${port} --name gtd-local-run gtd-local`, { cwd: projectRoot });
    },
    'npm-start':      () => spawn('npm', ['start'], { cwd: projectRoot, env: { ...process.env, PORT: port } }),
    'npm-dev':        () => spawn('npm', ['run', 'dev'], { cwd: projectRoot, env: { ...process.env, PORT: port } }),
    'python-run':     () => {
      const entry = findPythonEntry(projectRoot);
      spawn('python', [entry], { cwd: projectRoot, env: { ...process.env, PORT: port } });
    },
  };

  runners[method]();
  return { method, port };
}

async function healthCheck(url, timeoutMs = 30000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return { healthy: true, statusCode: res.status, elapsed: Date.now() - start };
    } catch {}
    await sleep(intervalMs);
  }
  return { healthy: false, elapsed: Date.now() - start };
}

function findAvailablePort(startPort) {
  let port = startPort;
  while (isPortInUse(port) && port < startPort + 100) {
    port++;
  }
  if (port >= startPort + 100) throw new Error('GTD-E012: No available ports in range');
  return port;
}
```

### 14.4 Test Runner Module (`lib/test-runner.cjs`)

```javascript
/**
 * Test suite discovery, execution, and coverage collection.
 *
 * Discovers test frameworks, runs suites, collects coverage,
 * and maps failures back to source files.
 */

const TEST_FRAMEWORKS = [
  { name: 'jest',     detect: () => hasDep('jest') || fileExists('jest.config.*'), cmd: 'npx jest --coverage --json' },
  { name: 'vitest',   detect: () => hasDep('vitest') || fileExists('vitest.config.*'), cmd: 'npx vitest run --coverage --reporter=json' },
  { name: 'mocha',    detect: () => hasDep('mocha') || fileExists('.mocharc.*'), cmd: 'npx mocha --reporter json' },
  { name: 'pytest',   detect: () => hasDep('pytest') || fileExists('pytest.ini') || fileExists('pyproject.toml'), cmd: 'python -m pytest --tb=short --json-report -q' },
  { name: 'go-test',  detect: () => fileExists('go.mod'), cmd: 'go test -json -cover ./...' },
];

function discoverTestSuites(projectRoot) {
  const discovered = [];
  for (const fw of TEST_FRAMEWORKS) {
    if (fw.detect()) {
      discovered.push({ framework: fw.name, command: fw.cmd });
    }
  }
  return discovered;
}

function runTests(projectRoot, options = {}) {
  const suites = options.suites || discoverTestSuites(projectRoot);
  const results = [];

  for (const suite of suites) {
    try {
      const output = execSync(suite.command, {
        cwd: projectRoot,
        timeout: options.timeoutMs || 300000,
        encoding: 'utf8',
      });
      const parsed = parseTestOutput(suite.framework, output);
      results.push({ ...parsed, framework: suite.framework, success: true });
    } catch (err) {
      const parsed = parseTestOutput(suite.framework, err.stdout || '');
      results.push({ ...parsed, framework: suite.framework, success: false, error: err.message });
    }
  }

  return results;
}

function collectCoverage(testResults) {
  const coverage = { lines: 0, branches: 0, functions: 0, statements: 0 };
  for (const result of testResults) {
    if (result.coverage) {
      for (const key of Object.keys(coverage)) {
        coverage[key] = Math.max(coverage[key], result.coverage[key] || 0);
      }
    }
  }
  return coverage;
}

function mapFailures(testResults, projectRoot) {
  const failures = [];
  for (const result of testResults) {
    if (!result.success && result.failures) {
      for (const failure of result.failures) {
        failures.push({
          test: failure.name,
          file: failure.file ? path.resolve(projectRoot, failure.file) : null,
          message: failure.message,
          framework: result.framework,
        });
      }
    }
  }
  return failures;
}
```

---

## 15. Forward Agent Definitions

### 15.1 Executor Agent

```markdown
---
name: gtd-executor
description: Execute plan tasks, write code, make atomic commits, produce SUMMARY.md
tools: [Read, Write, Bash, Grep, Glob, Edit]
model_tier: sonnet
color: "#F59E0B"
---

<purpose>
Execute tasks defined in a phase execution plan. Write production code,
make atomic commits per task, and produce a SUMMARY.md documenting
what was built and any deviations from the plan.
</purpose>

<inputs>
- .planning/phases/<N>/PLAN-<name>.md (execution plan)
- .planning/CODEBASE-MAP.md (project context)
- .planning/config.json (preferences)
- Source code (read and modify as needed)
</inputs>

<process>
1. Read the execution plan and parse all tasks
2. For each task in order:
   a. Read relevant source files for context
   b. Implement the required changes
   c. Verify the code compiles/parses without errors
   d. Create an atomic git commit with descriptive message
   e. Log progress to .planning/phases/<N>/PROGRESS.md
3. After all tasks complete:
   a. Generate SUMMARY.md in the phase directory
   b. List all files created/modified
   c. Note any deviations from the plan with rationale
   d. Update phase status to 'executed'
</process>

<quality_rules>
- Each commit must be atomic (one logical change)
- Code must pass syntax/compile checks before committing
- Follow existing project conventions (style, naming, structure)
- Never modify files outside the plan scope without documenting why
- If a task cannot be completed, log the blocker and continue
</quality_rules>
```

### 15.2 Planner Agent

```markdown
---
name: gtd-planner
description: Create detailed execution plans from phase scope and requirements
tools: [Read, Write, Bash, Grep, Glob]
model_tier: sonnet
color: "#6366F1"
---

<purpose>
Analyze the scope of a phase and produce a detailed, ordered execution
plan that an executor agent can follow step by step. Break complex
deliverables into atomic, testable tasks.
</purpose>

<inputs>
- .planning/ROADMAP.md (overall project roadmap)
- .planning/phases/<N>/PHASE.json (phase metadata)
- .planning/REQUIREMENTS.md (if available)
- .planning/CODEBASE-MAP.md (existing project context)
- Source code (read for context)
</inputs>

<process>
1. Read the phase scope from ROADMAP.md and PHASE.json
2. Analyze the existing codebase to understand current state
3. Decompose deliverables into ordered, atomic tasks:
   a. Each task has a clear input, action, and output
   b. Tasks are ordered by dependency (no circular deps)
   c. Each task is independently verifiable
4. For each task, specify:
   - Description of what to build
   - Files to create or modify
   - Acceptance criteria
   - Estimated complexity (low/medium/high)
5. Write PLAN-<name>.md to the phase directory
6. Update PHASE.json with plan reference
</process>

<output_format>
Write PLAN-<name>.md with:
- Phase context and goals
- Ordered task list with acceptance criteria
- File manifest (files to create/modify/delete)
- Risk notes and fallback strategies
- Estimated total complexity
</output_format>
```

### 15.3 Deployer Agent

```markdown
---
name: gtd-deployer
description: Detect deploy method, build, start, and health check locally
tools: [Read, Bash, Grep, Glob]
model_tier: haiku
color: "#EC4899"
---

<purpose>
Deploy the project locally for verification. Detect the appropriate
deployment method, run the build, start the service, and verify
it is healthy via endpoint checks.
</purpose>

<inputs>
- Project root directory
- .planning/config.json (deploy preferences)
- Package manifests (package.json, Dockerfile, etc.)
</inputs>

<process>
1. Detect deployment method:
   - Check for docker-compose.yml → docker compose up
   - Check for Dockerfile → docker build and run
   - Check for package.json with start/dev script → npm start/dev
   - Check for Python entry point → python run
2. Run build step if applicable:
   - npm run build / pip install / docker build
3. Start the service:
   - Find available port (default range: 3000-3099)
   - Launch process with appropriate environment
4. Health check:
   - Poll the health endpoint (default: http://localhost:<port>/)
   - Timeout after 30 seconds
   - Report status: healthy/unhealthy with details
5. Write deploy status to .planning/DEPLOY-STATUS.json
</process>

<error_handling>
- Port in use → find next available, retry
- Build failure → capture stderr, report GTD-E012
- Health check timeout → report with last error
- Docker not installed → fall back to npm/python method
</error_handling>
```

### 15.4 Test Runner Agent

```markdown
---
name: gtd-test-runner
description: Discover tests, run suites, collect coverage, map failures to source
tools: [Read, Bash, Grep, Glob, Write]
model_tier: haiku
color: "#14B8A6"
---

<purpose>
Discover and execute test suites for the project. Collect coverage
data, parse results, and map any failures back to specific source
files and functions for targeted remediation.
</purpose>

<inputs>
- Project root directory
- .planning/config.json (test preferences)
- Package manifests and test config files
</inputs>

<process>
1. Discover test frameworks:
   - Scan for jest, vitest, mocha, pytest, go test configs
   - Identify test file patterns and locations
2. Execute test suites:
   - Run each discovered framework with coverage enabled
   - Capture JSON output for structured parsing
   - Enforce timeout (default: 5 minutes per suite)
3. Collect coverage:
   - Parse coverage reports from each framework
   - Aggregate line, branch, function, and statement coverage
4. Map failures:
   - For each failed test, identify:
     - Test file and test name
     - Source file under test
     - Error message and stack trace
   - Group failures by source file
5. Write results:
   - .planning/TEST-RESULTS.json (machine-readable)
   - .planning/TEST-REPORT.md (human-readable summary)
   - Include coverage summary and failure map
</process>

<output_format>
TEST-REPORT.md includes:
- Overall pass/fail summary
- Coverage percentages (line, branch, function, statement)
- Failed test details with source file mapping
- Recommendations for fixing failures
</output_format>
```

---

## 16. Sync Module Specifications

### 16.1 Drift Engine Module (`lib/drift-engine.cjs`)

```javascript
/**
 * Drift detection between specifications and code reality.
 *
 * Compares REQUIREMENTS.md (or other spec documents) against the
 * actual codebase to detect additions, removals, mutations,
 * and structural drift. Generates DRIFT-REPORT.md.
 *
 * Drift categories:
 *   - ADDITION:   Code exists that has no spec coverage
 *   - REMOVAL:    Spec requirement has no code implementation
 *   - MUTATION:   Implementation differs from spec intent
 *   - STRUCTURAL: Architecture diverges from spec design
 */

const DRIFT_CATEGORIES = ['addition', 'removal', 'mutation', 'structural'];

function detectDrift(docsRoot, projectRoot) {
  const requirements = parseRequirements(path.join(docsRoot, 'REQUIREMENTS.md'));
  const codebaseMap = loadCodebaseMap(docsRoot);
  const driftItems = [];

  // Check each requirement against code
  for (const req of requirements) {
    const match = findCodeMatch(req, projectRoot, codebaseMap);

    if (!match.found) {
      driftItems.push({
        category: 'removal',
        requirement: req.id,
        description: req.description,
        expected: req.acceptance_criteria,
        actual: null,
        severity: req.priority === 'high' ? 'critical' : 'warning',
      });
    } else if (match.divergence) {
      driftItems.push({
        category: 'mutation',
        requirement: req.id,
        description: req.description,
        expected: req.acceptance_criteria,
        actual: match.summary,
        files: match.files,
        severity: match.divergenceLevel,
      });
    }
  }

  // Check for code without spec coverage
  const specCoveredFiles = requirements.flatMap(r => findCodeMatch(r, projectRoot, codebaseMap).files || []);
  const allSourceFiles = codebaseMap.modules.flatMap(m => m.files || []);
  const uncoveredFiles = allSourceFiles.filter(f => !specCoveredFiles.includes(f));

  if (uncoveredFiles.length > 0) {
    driftItems.push({
      category: 'addition',
      description: `${uncoveredFiles.length} source files have no spec coverage`,
      files: uncoveredFiles,
      severity: 'info',
    });
  }

  return driftItems;
}

function generateDriftReport(docsRoot, projectRoot) {
  const driftItems = detectDrift(docsRoot, projectRoot);

  const report = {
    timestamp: new Date().toISOString(),
    commit: getGitCommit(projectRoot),
    summary: {
      total: driftItems.length,
      additions: driftItems.filter(d => d.category === 'addition').length,
      removals: driftItems.filter(d => d.category === 'removal').length,
      mutations: driftItems.filter(d => d.category === 'mutation').length,
      structural: driftItems.filter(d => d.category === 'structural').length,
    },
    items: driftItems,
  };

  const markdown = renderDriftReportMarkdown(report);
  atomicWrite(path.join(docsRoot, 'DRIFT-REPORT.md'), markdown);
  atomicWrite(path.join(docsRoot, 'DRIFT-REPORT.json'), JSON.stringify(report, null, 2));

  return report;
}
```

### 16.2 Drift Detection Algorithm

```
Input:  REQUIREMENTS.md, source code tree, CODEBASE-MAP.md
Output: DRIFT-REPORT.md with categorized drift items

Algorithm:

1. PARSE REQUIREMENTS
   - Read REQUIREMENTS.md
   - Extract each requirement: { id, description, acceptance_criteria, priority }
   - Build requirement index by ID

2. CHECK EACH REQUIREMENT AGAINST CODE
   For each requirement R:
     a. Extract keywords and identifiers from R.description and R.acceptance_criteria
     b. Search codebase for matching patterns:
        - Grep for function/class/route names mentioned in R
        - Check file paths mentioned in R
        - Look for comment references to R.id (e.g., "// REQ-001")
     c. Classify match:
        - FULL MATCH:    All acceptance criteria have corresponding code → no drift
        - PARTIAL MATCH: Some criteria met, others missing → MUTATION drift
        - NO MATCH:      No code found for requirement → REMOVAL drift

3. CHECK CODE FOR SPEC COVERAGE
   For each source file F not matched by any requirement:
     a. Determine if F contains significant logic (not config/boilerplate)
     b. If significant → ADDITION drift (code without spec)

4. CHECK STRUCTURAL ALIGNMENT
   If architecture spec exists:
     a. Compare declared module boundaries vs actual directory structure
     b. Compare declared dependencies vs actual import graph
     c. Mismatches → STRUCTURAL drift

5. CATEGORIZE AND SCORE
   For each drift item:
     - Assign category: addition | removal | mutation | structural
     - Assign severity: critical | warning | info
       - critical: high-priority requirement missing implementation
       - warning: implementation diverges from spec
       - info: code exists without spec coverage

6. GENERATE REPORT
   Write DRIFT-REPORT.md with:
     - Summary counts by category
     - Detailed items sorted by severity
     - Affected files list
     - Recommended actions for each item
```

---

*End of Low-Level Design Document*
