<purpose>
Execute a trivial task inline with zero planning ceremony. User describes what they want,
agent does it immediately, one atomic commit, done. For tasks that are too small to
justify even a quick plan.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-fast-executor — Inline execution without planning
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init fast "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract task description from arguments.
</step>

<step name="validate_scope">
If the task description implies:
- More than ~10 files changing
- Multiple independent features
- Complex architectural decisions

Then suggest /gtd-quick instead:
```
  ⚠ This looks bigger than a fast task.

    Consider: /gtd-quick "{task}" (adds lightweight planning)
```

Otherwise, proceed.
</step>

<step name="execute">
Spawn gtd-fast-executor with the task description.
Agent reads relevant code, makes changes, verifies, and commits.

Display:
```
  ◐ Executing: {task description}...
```
</step>

<step name="report">
After executor completes, display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Done                                                   │
│                                                            │
│  Task         {description}                                │
│  Commit       {sha} {message}                              │
│  Files        {count} modified                             │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
</step>

</process>
