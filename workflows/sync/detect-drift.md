<purpose>
Detect drift between specifications, documentation, and actual code. This is the entry point of the sync pipeline — it identifies where things have gone out of alignment so that reconciliation can bring them back.
</purpose>

<available_agent_types>
- gtd-drift-detector — Compares specs and docs against actual code to detect drift
</available_agent_types>

<process>

<step name="initialize" priority="first">
Load context:

```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init detect-drift "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_root`, `docs_root`, `config`, `state`, `git`, `args`.

Check for `--since` flag (commit hash to compare from) and `--scope` flag (specs|docs|both, default: both).
</step>

<step name="check_if_needed">
Check if drift detection is needed:

```bash
DRIFT_CHECK=$(node "$GTD_TOOLS_PATH/drift-engine.cjs" check "$ARGUMENTS")
if [[ "$DRIFT_CHECK" == @file:* ]]; then DRIFT_CHECK=$(cat "${DRIFT_CHECK#@file:}"); fi
```

Parse result for `needs_check` boolean and `reason`.

If `needs_check` is false AND `--force` is not set:
  Display:
  ```
  No drift detection needed: {reason}
  Use --force to run anyway.
  ```
  EXIT — no work needed.
</step>

<step name="build_drift_context">
Build context for the drift detector:

```bash
DRIFT_CTX=$(node "$GTD_TOOLS_PATH/drift-engine.cjs" context "$ARGUMENTS")
if [[ "$DRIFT_CTX" == @file:* ]]; then DRIFT_CTX=$(cat "${DRIFT_CTX#@file:}"); fi
```

Parse result for: `specs_available`, `docs_available`, `last_sync_commit`, `files_changed_since`.

If no specs and no docs are available:
  Display:
  ```
  No specifications or documents found to compare against code.
  Run /gtd-scan and /gtd-create-* first, or create REQUIREMENTS.md.
  ```
  EXIT.
</step>

<step name="spawn_drift_detector">
Spawn `gtd-drift-detector` agent with prompt:

```
Detect drift in the project at: {project_root}

Scope: {args.scope or "both"}
Since commit: {args.since or "all"}

Available specs: {specs_available}
Available docs: {docs_available}
Last sync commit: {last_sync_commit}
Files changed since last sync: {files_changed_since}

Docs root: {docs_root}

Follow the process defined in your agent definition.
Write the drift report to: {docs_root}/DRIFT-REPORT.md
```

Wait for agent completion. Verify DRIFT-REPORT.md exists.
</step>

<step name="update_state">
Read the generated DRIFT-REPORT.md frontmatter to get counts.

If total_items > 0 (any drift found):
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status drifted
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_drift_check "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.drift_items "{total_items}"
```

If total_items == 0 (no drift):
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status synced
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_drift_check "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.drift_items "0"
```
</step>

<step name="report">
Display summary:

```
Found {total_items} drift items: {critical} critical, {major} major, {minor} minor, {info} info

Status: {DRIFTED or SYNCED}

Run /gtd-reconcile to plan fixes, or /gtd-audit for full coverage analysis.
```
</step>

</process>

<error_handling>
- If drift detector agent fails: report error, suggest checking if specs/docs exist
- If DRIFT-REPORT.md is not produced: report failure, check agent output for errors
- If specs are missing but docs exist: run with docs-only scope
- If docs are missing but specs exist: run with specs-only scope
</error_handling>
