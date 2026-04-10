<purpose>
Start a new milestone. Archives current milestone state, clears phase statuses, optionally updates REQUIREMENTS.md with new scope, and creates a new milestone entry in ROADMAP.md.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init new-milestone "$ARGUMENTS")
```
Parse: docs_root, config, state, current milestone info from ROADMAP.md.
Parse flags: --name "milestone name", --version "v2", --scope "description".
</step>

<step name="archive_current">
If a current milestone exists:
  1. Create archive directory: .planning/milestones/{milestone_name}/
  2. Copy current STATE.md, ROADMAP.md, and phase summaries to archive
  3. Record completion timestamp

```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update milestone.archived "true"
```
</step>

<step name="reset_state">
Clear forward pipeline state for the new milestone:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status "idle"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_phase "0"
```

If --scope flag provided: update REQUIREMENTS.md with new scope section.
</step>

<step name="create_milestone">
Add new milestone entry to ROADMAP.md:
- Milestone name and version
- Start date
- Phase list (empty or from --scope)

Display:
```
New milestone: {name}

  Previous milestone archived: .planning/milestones/{old_name}/
  State: reset to idle
  Phases: {count or "none yet — use /gtd-add-phase"}

  Next: /gtd-add-phase (define phases)
        /gtd-discuss-phase 1 (start first phase)
```
</step>

</process>

<error_handling>
- Current milestone has incomplete phases → warn user, require --force to proceed
- Archive directory already exists → append timestamp suffix to avoid overwrite
- No current milestone → skip archive step, create fresh
</error_handling>
