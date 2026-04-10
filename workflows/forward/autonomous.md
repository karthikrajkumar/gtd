<purpose>
Run phases N through M unattended. Loops through each phase from current to target, executing the full pipeline (discuss, plan, execute, verify) with auto-approved gates. Stops on any abort gate.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init autonomous "$ARGUMENTS")
```
Parse: docs_root, state, roadmap, config.
Parse flags: --from N (default: current phase), --to M (required).
Validate: phase range exists in ROADMAP.md.
</step>

<step name="configure_auto_mode">
Set auto-approve for all human gates within the loop.
Record original state so it can be restored on abort.
Track progress: phases_completed, phases_remaining, errors.
</step>

<step name="loop_phases">
For each phase from {start} to {target}:

  1. **Discuss** (auto): run discuss-phase with --auto flag, skip interactive prompts
  2. **Plan**: run plan-phase for the current phase
  3. **Execute**: run execute-phase for the current phase
  4. **Verify**: run verify-work for the current phase

  After each sub-step:
  - Check result status — if abort gate triggered, stop immediately
  - Update progress tracker
  - Log: "Phase {N}/{M}: {sub_step} complete"

  ```bash
  node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_phase "$PHASE"
  ```
</step>

<step name="report">
Display:
```
Autonomous run complete

  Phases completed: {count}/{total}
  Total commits: {commit_count}
  Duration: {elapsed}
  Status: {success|aborted at Phase N step}

  Next: /gtd-ship (create PR)
        /gtd-deploy-local (test locally)
```
</step>

</process>

<error_handling>
- Abort gate triggered → stop loop, preserve state, report which phase/step failed
- Executor crash → retry phase once, then abort with report
- Verification failure → attempt debug loop (3 tries), then abort if unresolved
- Ctrl+C / interrupt → save progress, report partial completion
</error_handling>
