<purpose>
Fast mode: skip research phase, go straight to planning. Like plan-phase but without spawning research agents. Uses existing knowledge only. Good for well-understood tasks where requirements are clear.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init fast "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, roadmap.
Verify: phase exists in ROADMAP.md.
</step>

<step name="skip_research">
Mark research as skipped in state:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status "research_skipped"
```

Create a minimal CONTEXT.md for the phase noting research was skipped:
```
# Phase {N} Context
Research: Skipped (fast mode)
Using existing project knowledge only.
```
</step>

<step name="plan">
Proceed directly to planning using existing project docs:
- Read PROJECT.md, REQUIREMENTS.md, ROADMAP.md
- Generate plans based on phase requirements and existing codebase
- Write plans to phases/{phase}/ directory

This follows the same plan generation logic as plan-phase
but without RESEARCH.md input.

```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status "planned"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_phase "$PHASE_NUMBER"
```
</step>

<step name="display">
Display:
```
Fast-planned Phase {N}: {phase_name}

  Research: skipped
  Plans created: {count}
  Tasks total: {task_count}

  Next: /gtd-execute-phase {N} (execute plans)
        /gtd-next (auto-advance)
```
</step>

</process>

<error_handling>
- Phase requirements unclear without research → warn user, suggest /gtd-discuss-phase instead
- Missing PROJECT.md or REQUIREMENTS.md → error: "Project docs required. Run /gtd-new-project first."
- Phase already planned → ask user whether to overwrite existing plans
</error_handling>
