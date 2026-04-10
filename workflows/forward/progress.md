<purpose>
Show forward pipeline progress dashboard — milestone, phases, tasks, estimates.
</purpose>

<process>

<step name="initialize">
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
ROADMAP=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" roadmap status)
```
</step>

<step name="display">
```
Forward Pipeline Progress
═════════════════════════

Milestone: {name}
Status: {forward.status}

Phases:
  ✓ Phase 1: Auth (complete)
  → Phase 2: API (executing — wave 2/3)
  ○ Phase 3: Frontend (pending)
  ○ Phase 4: Deploy (pending)

Current Phase Progress:
  Plans: 2/3 complete
  Tasks: 8/12 complete
  Coverage: 67%

Estimated Remaining: {phases_left} phases
```
</step>

</process>
