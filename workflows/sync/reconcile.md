<purpose>
Plan how to reconcile drift between specifications, documentation, and code. Takes the drift report as input and produces an actionable reconciliation plan with per-item actions and effort estimates.
</purpose>

<available_agent_types>
- gtd-reconciliation-planner — Plans how to reconcile drift between specs and code
</available_agent_types>

<process>

<step name="initialize" priority="first">
Load context:

```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init reconcile "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_root`, `docs_root`, `config`, `state`, `args`.

Parse `--strategy` flag: `code-wins` | `spec-wins` | `interactive` (default: `interactive`).
</step>

<step name="check_drift_report">
Check if a drift report exists:

```bash
test -f "$DOCS_ROOT/DRIFT-REPORT.md" && echo "EXISTS" || echo "MISSING"
```

If MISSING:
  Display:
  ```
  No drift report found. Run /gtd-drift first to detect drift.
  ```
  EXIT — cannot reconcile without drift data.

If EXISTS, read the frontmatter to confirm there are drift items:
- If `total_items` is 0:
  Display:
  ```
  Drift report shows 0 items — everything is in sync.
  No reconciliation needed.
  ```
  EXIT.
</step>

<step name="spawn_reconciliation_planner">
Spawn `gtd-reconciliation-planner` agent with prompt:

```
Plan reconciliation for the project at: {project_root}

Strategy: {args.strategy or "interactive"}

Drift report: {docs_root}/DRIFT-REPORT.md
Specs root: {project_root}
Docs root: {docs_root}

Follow the process defined in your agent definition.
Write the reconciliation plan to: {docs_root}/RECONCILIATION-PLAN.md
```

Wait for agent completion. Verify RECONCILIATION-PLAN.md exists.
</step>

<step name="present_plan">
Read the generated RECONCILIATION-PLAN.md and present a summary to the user:

```
Reconciliation Plan ({strategy} strategy)

  Total actions: {total_actions}
  Needs user decision: {needs_decision}
  Auto-resolvable: {auto}

  Effort breakdown:
    Trivial: {trivial}
    Small: {small}
    Medium: {medium}
    Large: {large}

  Estimated total effort: {hours} hours
```

If strategy is `interactive`, list the items that need a decision:
```
Items requiring your decision:
  1. [CRITICAL] {description} — recommend: {direction}
  2. [MAJOR] {description} — recommend: {direction}
  ...

Review the full plan at: {docs_root}/RECONCILIATION-PLAN.md
Run /gtd-sync to execute the plan.
```
</step>

<step name="update_state">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.status reconciling
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.reconciliation_strategy "{strategy}"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_reconciliation "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```
</step>

</process>

<error_handling>
- If reconciliation planner agent fails: report error, suggest checking drift report format
- If RECONCILIATION-PLAN.md is not produced: report failure, check agent output
- If drift report is malformed: report error, suggest re-running /gtd-drift
- If strategy flag is invalid: default to interactive with a warning
</error_handling>
