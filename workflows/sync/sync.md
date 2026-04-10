<purpose>
The auto-sync workflow: detect drift, reconcile, and apply changes to bring specs, docs, and code back into alignment. This is the all-in-one command for keeping a project synchronized.
</purpose>

<available_agent_types>
- gtd-drift-detector — Compares specs and docs against actual code to detect drift
- gtd-reconciliation-planner — Plans how to reconcile drift between specs and code
</available_agent_types>

<process>

<step name="initialize" priority="first">
Load context:

```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init sync "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_root`, `docs_root`, `config`, `state`, `git`, `args`.

Parse flags:
- `--auto` — Fully automatic mode: use code-wins strategy, auto-approve all actions
- `--direction` — `forward` (specs to code) | `backward` (code to specs) | `both` (default: both)
- `--force` — Force re-detection even if recent drift report exists
</step>

<step name="detect_drift">
Run drift detection (equivalent to /gtd-drift):

Check if a recent DRIFT-REPORT.md exists AND `--force` is not set:
- If exists and less than 1 hour old: reuse it
- Otherwise: run drift detection

```bash
DRIFT_CTX=$(node "$GTD_TOOLS_PATH/drift-engine.cjs" context "$ARGUMENTS")
if [[ "$DRIFT_CTX" == @file:* ]]; then DRIFT_CTX=$(cat "${DRIFT_CTX#@file:}"); fi
```

Spawn `gtd-drift-detector` agent with the project context.
Wait for DRIFT-REPORT.md.

If no drift found:
  Display:
  ```
  Everything is in sync. No changes needed.
  ```
  Update state to "synced" and EXIT.
</step>

<step name="determine_strategy">
Determine reconciliation strategy based on flags:

- If `--auto` is set: strategy = `code-wins`
- If `--direction forward`: strategy = `spec-wins` (specs drive code changes)
- If `--direction backward`: strategy = `code-wins` (code drives spec/doc updates)
- If `--direction both`: strategy = `interactive` (unless `--auto`, then `code-wins`)
- Default (no flags): strategy = `interactive`
</step>

<step name="reconcile">
Spawn `gtd-reconciliation-planner` agent with the determined strategy.

Wait for RECONCILIATION-PLAN.md.

If strategy is `interactive` (and `--auto` is NOT set):
  Present the plan to the user and wait for approval:
  ```
  Reconciliation plan ready with {total_actions} actions.
  Review: {docs_root}/RECONCILIATION-PLAN.md

  Approve and apply? (yes/no)
  ```
  If user declines: EXIT with state "reconciling".
</step>

<step name="apply_changes">
Apply the reconciliation plan:

### For code-wins actions (update specs/docs):
- Read each affected document
- Apply the planned changes (update sections, fix paths, correct versions)
- Write updated documents back

### For spec-wins actions (update code):
- Create task items in `.planning/SYNC-TASKS.md` for code changes
- Each task includes: description, affected files, acceptance criteria
- Display tasks for developer action

### For document regeneration:
- If a document is too stale (> 50% claims incorrect), trigger full regeneration
- Use the backward pipeline: /gtd-create-{type} --force

```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status applying
```
</step>

<step name="verify_sync">
After applying changes, run a quick verification:

- Re-check critical drift items to confirm they're resolved
- Count remaining drift items

If all resolved:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status synced
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_sync "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_sync_commit "$(git rev-parse --short HEAD)"
```

If some remain:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status partially_synced
```
</step>

<step name="report">
Display final summary:

```
Sync complete.

  Actions applied: {applied} / {total}
  Docs updated: {docs_updated}
  Tasks created: {tasks_created}
  Remaining drift: {remaining}

  Status: {SYNCED / PARTIALLY_SYNCED}
```

If tasks were created for code changes:
```
  Code tasks pending developer action:
    1. {task description} — {affected files}
    2. ...

  See: {docs_root}/SYNC-TASKS.md
```
</step>

</process>

<error_handling>
- If drift detection fails: report error, suggest running /gtd-drift independently
- If reconciliation fails: report error, suggest running /gtd-reconcile independently
- If a document update fails: skip that item, continue with others, report at end
- If --auto mode encounters a CRITICAL spec-wins item: pause and warn user (safety override)
- If git is dirty (uncommitted changes): warn user before applying changes
</error_handling>
