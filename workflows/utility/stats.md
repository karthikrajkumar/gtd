<purpose>
Gather and display project statistics — commits, phases, agents used, time metrics.
Provides a high-level health view of the project's progress.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init stats "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract --since, --phase flags.
</step>

<step name="gather_metrics">
Collect from multiple sources:

**Git:**
```bash
TOTAL_COMMITS=$(git rev-list --count HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
FILES_CHANGED=$(git diff --stat HEAD~10 | tail -1)
```

**Planning artifacts:**
- Count phases (completed vs total)
- Count plan tasks (executed vs total)
- Count quick tasks
- Count spikes (validated/invalidated/inconclusive)
- Count sketches
- Count documents generated
- Count sessions (archived HANDOFFs)

**Quality:**
- Average verification score
- Average document accuracy
- Drift items (current)
</step>

<step name="display">
Render the stats dashboard per references/output-style.md.
(See the full template in the command definition.)
</step>

</process>
