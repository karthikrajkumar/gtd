<purpose>
Auto-advance to the next pipeline step. Reads STATE.md to determine current position, then routes to the appropriate next command based on the current phase status.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init next "$ARGUMENTS")
```
Parse: docs_root, state (forward.status, forward.current_phase), roadmap.
</step>

<step name="determine_position">
Read STATE.md forward pipeline status. Map current status to next action:

| Current Status   | Next Command           | Reason                          |
|------------------|------------------------|---------------------------------|
| idle             | /gtd-discuss-phase 1   | Start first phase               |
| researched       | /gtd-plan-phase {N}    | Research done, ready to plan    |
| planned          | /gtd-execute-phase {N} | Plans ready, begin execution    |
| executing        | /gtd-verify-work {N}   | Execution done, verify results  |
| verified         | /gtd-ship              | Verified, ready to ship         |
| shipped          | /gtd-discuss-phase {N+1} | Phase done, start next phase |
| deployed         | /gtd-test-phase {N}    | Deployed, run tests             |

If all phases complete: suggest /gtd-complete-milestone.
</step>

<step name="display_and_route">
Display:
```
Current: Phase {N} — {phase_name}
Status:  {current_status}

Next step: {next_command}
Reason:   {reason}
```

Execute the determined next command automatically.
</step>

</process>

<error_handling>
- Unknown status → display state and ask user for direction
- No phases in roadmap → suggest /gtd-new-project or /gtd-add-phase
- State file missing → suggest /gtd-new-project to initialize
</error_handling>
