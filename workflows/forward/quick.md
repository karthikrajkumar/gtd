<purpose>
Execute an ad-hoc task with GTD guarantees (atomic commits, state tracking) but without
the full phased pipeline ceremony. Supports optional flags for research, discussion,
and verification — composable levels of rigor.
</purpose>

<required_reading>
@references/output-style.md
@references/agent-contracts.md
</required_reading>

<available_agent_types>
- gtd-quick-planner — Lightweight planner for ad-hoc tasks
- gtd-executor — Executes plan tasks, writes code, commits
- gtd-phase-researcher — Focused research (if --research)
- gtd-plan-checker — Verifies plan quality (if --validate)
- gtd-verifier — Post-execution verification (if --validate)
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init quick "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract flags: --discuss, --research, --validate, --full.
If --full: enable all three (discuss + research + validate).

Create quick task directory:
```bash
TASK_NUM=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" phase next-quick-number)
TASK_DIR=".planning/quick/${TASK_NUM}-${SLUG}"
mkdir -p "$TASK_DIR"
```
</step>

<step name="get_task">
If task description not in arguments, ask:
"What do you want to do?"

Wait for user response. Parse task intent.
</step>

<step name="discuss" if="--discuss or --full">
Surface gray areas for this specific task:
- Identify 2-4 decisions that could go either way
- Present them as quick options (not deep questioning)
- Record decisions in `{TASK_DIR}/CONTEXT.md`

Keep it lightweight — 1-2 minutes max, not a full discuss-phase.
</step>

<step name="research" if="--research or --full">
Spawn focused researcher:
- Single agent (not 4 parallel — this is a quick task)
- Investigates implementation approach for this specific task
- Writes findings to `{TASK_DIR}/RESEARCH.md`

Display progress:
```
  ◐ Researching approach...
  ✓ Research complete
```
</step>

<step name="plan">
Spawn gtd-quick-planner:
- Reads task description, optional CONTEXT.md, optional RESEARCH.md
- Produces `{TASK_DIR}/PLAN.md`

Display:
```
  ◐ Planning...
  ✓ Plan created ({task_count} tasks)
```
</step>

<step name="check" if="--validate or --full">
Spawn gtd-plan-checker on the quick plan.
If FAIL: revise once, then present to user.
</step>

<step name="execute">
Spawn gtd-executor with the quick plan.
Each task gets an atomic commit.

Display progress:
```
  ◐ Executing...
    ✓ Task 1: {name}    {commit_sha}
    ✓ Task 2: {name}    {commit_sha}
    ◐ Task 3: {name}    running...
```
</step>

<step name="verify" if="--validate or --full">
Spawn gtd-verifier on the quick task output.
Check that acceptance criteria from the plan are met.
</step>

<step name="report">
Write `{TASK_DIR}/SUMMARY.md` with results.

Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Quick task complete                                    │
│                                                            │
│  Task         {description}                                │
│  Commits      {count}                                      │
│  Files        {count} modified                             │
│  {#if verified}                                            │
│  Verified     ✓                                            │
│  {/if}                                                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-next     continue pipeline
    → /gtd-quick    another quick task
```
</step>

</process>

<error_handling>
- Task too large (planner produces > 5 tasks) → suggest /gtd-plan-phase instead
- Execution failure → spawn debugger, retry once
- Verification failure → report what's broken, suggest /gtd-debug
</error_handling>
