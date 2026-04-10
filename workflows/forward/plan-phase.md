<purpose>
Research implementation approaches and create a verified execution plan for a specific phase.
Pipeline: research (4 parallel) → plan → check → revise (up to 3x).
</purpose>

<required_reading>
@references/planning-config.md
@references/agent-contracts.md
@references/gate-prompts.md
</required_reading>

<available_agent_types>
- gtd-phase-researcher — Phase-specific research (x4 parallel)
- gtd-planner — Creates detailed execution plan
- gtd-plan-checker — Verifies plan quality
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init plan-phase "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, roadmap, phase_context, research.
Verify phase exists in ROADMAP.md.
</step>

<step name="research">
Spawn 4 parallel gtd-phase-researcher agents focused on this phase:
  Each receives: ROADMAP.md phase description, CONTEXT.md (if exists), PROJECT.md

  Researchers investigate:
  - Stack patterns for this phase's domain
  - Implementation approaches
  - Common pitfalls specific to this phase
  - Testing strategies

  Output: {phase}-RESEARCH.md (combined)
</step>

<step name="plan">
Spawn gtd-planner agent:
  Reads: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, {phase}-CONTEXT.md, {phase}-RESEARCH.md
  
  Produces one or more PLAN files:
    .planning/phases/{phase}/{phase}-01-{name}-PLAN.md
    .planning/phases/{phase}/{phase}-02-{name}-PLAN.md
    ...

  Each PLAN contains:
  - Ordered task list with dependencies
  - Wave grouping (independent tasks in same wave)
  - Files to create/modify per task
  - Verification commands per task
</step>

<step name="check">
Spawn gtd-plan-checker agent:
  Reads: PLAN files, REQUIREMENTS.md, source code
  
  Checks:
  - Requirements coverage (all phase reqs addressed)
  - Task granularity (not too big, not too small)
  - File path feasibility
  - Verification commands present
  - No scope creep beyond phase boundary
  
  Result: PASS or FAIL with revision instructions.
</step>

<step name="revision_loop" max_iterations="3">
If plan-checker returns FAIL:
  Feed revision instructions back to planner.
  Planner revises plan.
  Re-run plan-checker.
  
  After 3 failures: present to user with issues noted.
</step>

<step name="finalize">
Update state:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status planned
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_phase "$PHASE_NUMBER"
```

Display:
```
✓ Phase {N} planned

  Plans: {count}
  Tasks: {total_tasks} across {wave_count} waves
  Requirements covered: {covered}/{total}
  Plan checker: PASS ✓

  Next: /gtd-execute-phase {N}
```
</step>

</process>
