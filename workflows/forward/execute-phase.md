<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to executor subagents. Each executor gets a fresh context window.
</purpose>

<required_reading>
@references/agent-contracts.md
@references/context-budget.md
@references/gate-prompts.md
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-executor — Executes plan tasks, writes code, commits
- gtd-verifier — Verifies phase completion against requirements
- gtd-debugger — Diagnoses and fixes failures
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init execute-phase "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, roadmap, plans, git.
Also parse optional flags: --wave N (execute specific wave only), --sequential (force sequential).

Verify:
- Phase exists in ROADMAP.md
- Plans exist in phases/{phase}/ directory
- State is "planned" (ready for execution)
</step>

<step name="discover_plans">
```bash
PLANS=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" phase plans "$PHASE_NUMBER")
```
Parse plan list. If no plans → Error: "No plans found. Run /gtd-plan-phase first."

Analyze dependencies between plans (from plan frontmatter or naming).
Group into execution waves using `groupIntoWaves()`.

Display:
```
  ◐ Executing Phase {N}: {name}

    Wave 1 (parallel):
      {plan_names joined with " │ "}

    Wave 2 (depends on wave 1):
      {plan_names joined with " │ "}
    ...
```
</step>

<step name="execute_waves">
For each wave (or single wave if --wave flag):

  **If parallelization enabled AND runtime supports Task spawning:**
    Spawn one gtd-executor agent per plan in the wave (concurrent).
    Each executor runs in a worktree (if config.execution.use_worktrees is true).

  **Otherwise (sequential):**
    Execute plans one at a time in order.

  Each executor receives:
  ```
  Execute the plan at: {plan_path}
  
  Project context:
    PROJECT.md: {docs_root}/PROJECT.md
    REQUIREMENTS.md: {docs_root}/REQUIREMENTS.md
    CONTEXT.md: {phase_dir}/{phase}-CONTEXT.md
    RESEARCH.md: {phase_dir}/{phase}-RESEARCH.md
  
  Git commit after each task.
  Write completion to: {phase_dir}/{plan}-SUMMARY.md
  ```

  Wait for all executors in this wave to complete.
  Verify each produced a SUMMARY.md.
</step>

<step name="integration_checkpoint">
After each wave completes:
  1. Check all SUMMARY.md files — any failures?
  2. Run integration test suite (if available)
  3. If failures: spawn gtd-debugger to investigate
  4. If debug succeeds: continue to next wave
  5. If debug fails after 3 attempts: pause and present to user
</step>

<step name="post_execution_verification">
After all waves complete:
  Spawn gtd-verifier agent:
  ```
  Verify Phase {N} execution.
  
  SUMMARY files: {list of all SUMMARY.md paths}
  REQUIREMENTS.md: {path}
  ROADMAP.md: {path}
  
  Check: requirements coverage, test results, regression.
  Write: {phase_dir}/VERIFICATION.md
  ```
</step>

<step name="update_state">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status executing
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_phase "$PHASE_NUMBER"
```

After verification:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status verified
```

Display (per reference/output-style.md completion block):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Phase {N} executed                                     │
│                                                            │
│  Plans        {count} ({parallel_count} parallel + {seq_count} sequential) │
│  Commits      {commit_count} atomic commits                │
│  Verification {pass_count}/{total_reqs} requirements met   │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-verify-work {N}   confirm it works as expected
    → /gtd-ship {N}          create PR (skip verification)
    → /gtd-next              auto-advance
```
</step>

</process>

<error_handling>
- Executor timeout → check filesystem for partial SUMMARY.md, treat completed tasks as done
- Executor crash → retry plan once, then mark as failed
- Test failure during execution → executor's internal debug loop (3 attempts)
- Integration test failure → spawn debugger agent
- All plans failed → abort, preserve state, report to user
</error_handling>
