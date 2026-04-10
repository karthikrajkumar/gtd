<purpose>
Map the project structure for subsequent analysis and document generation. This is the entry point of the backward pipeline — everything downstream depends on the codebase map being accurate.
</purpose>

<required_reading>
@references/framework-signatures.md
@references/language-analyzers.md
</required_reading>

<available_agent_types>
- gtd-codebase-mapper — Scans and indexes project structure
</available_agent_types>

<process>

<step name="initialize" priority="first">
Load context:

```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init scan-codebase "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_root`, `docs_root`, `config`, `state`, `git`, `codebase_map`, `args`.

Check for `--force` flag in args.
</step>

<step name="check_existing">
If `codebase_map.exists` is true AND `codebase_map.stale` is false AND `--force` is not set:
  Display:
  ```
  Codebase map is current (commit: {codebase_map.commit}).
  Use /gtd-scan --force to re-scan.
  ```
  EXIT — no work needed.

If `codebase_map.exists` is true AND `codebase_map.stale` is true:
  Display:
  ```
  Codebase map is stale (last scan: {codebase_map.commit}, current: {git.commit}).
  Re-scanning...
  ```
</step>

<step name="create_planning_dir">
Ensure `.planning/` and `.planning/analysis/` directories exist:

```bash
mkdir -p "$DOCS_ROOT" "$DOCS_ROOT/analysis"
```
</step>

<step name="spawn_mapper">
Spawn `gtd-codebase-mapper` agent with prompt:

```
Scan the codebase at: {project_root}

Configuration:
  exclude_patterns: {config.scan.exclude_patterns}
  include_tests: {config.scan.include_tests}
  max_file_size_kb: {config.scan.max_file_size_kb}
  max_files: {config.scan.max_files}

Git context:
  commit: {git.commit}
  branch: {git.branch}

Write outputs to:
  1. {docs_root}/CODEBASE-MAP.md
  2. {docs_root}/analysis/FILE-INDEX.json

Follow the process defined in your agent definition.
```

Wait for agent completion. Verify outputs exist.
</step>

<step name="update_state">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update backward.status scanned
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update backward.last_scan_commit "$(git rev-parse --short HEAD)"
```
</step>

<step name="report">
Read the generated CODEBASE-MAP.md and present a summary:

```
✓ Codebase scanned successfully

  Project: {name}
  Files indexed: {count}
  Languages: {language list with percentages}
  Frameworks: {framework list}
  Entry points: {count}
  Infrastructure: {list}

  Run /gtd-analyze for deep analysis, or /gtd-create-* to generate documents.
```
</step>

</process>

<error_handling>
- If agent times out: retry once with `--deep false` to do shallow scan
- If agent fails to produce CODEBASE-MAP.md: report error, suggest checking file permissions
- If project is empty (0 source files): report "No source files found" and suggest checking exclude_patterns
- If git is not available: proceed without git context, note in CODEBASE-MAP.md frontmatter
</error_handling>
