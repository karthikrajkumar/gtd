<purpose>
Run a time-boxed technical experiment (spike) to validate or invalidate an assumption.
Produces throwaway code and a structured verdict that planning agents can trust.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-spike-runner — Executes the experiment and produces verdict
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init spike "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract hypothesis and --time-box flag (default 30).

Determine next spike number:
```bash
SPIKE_NUM=$(ls .planning/spikes/ 2>/dev/null | wc -l | xargs expr 1 +)
SLUG=$(echo "$HYPOTHESIS" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-40)
SPIKE_DIR=".planning/spikes/${SPIKE_NUM}-${SLUG}"
mkdir -p "$SPIKE_DIR/src"
```
</step>

<step name="frame">
Parse hypothesis into testable Given/When/Then:

Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ◐ Spike #{SPIKE_NUM}                                     │
│                                                            │
│  Hypothesis   {hypothesis}                                 │
│  Time-box     {minutes} min                                │
│                                                            │
│  Given:  {setup}                                           │
│  When:   {action}                                          │
│  Then:   {expected}                                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
</step>

<step name="execute">
Spawn gtd-spike-runner with:
- Hypothesis
- Success criteria
- Time-box
- SPIKE_DIR for output

The runner:
1. Sets up minimal environment in `{SPIKE_DIR}/src/`
2. Writes experiment code
3. Runs it, collects evidence
4. Writes `{SPIKE_DIR}/SPIKE.md` (experiment log)
5. Writes `{SPIKE_DIR}/VERDICT.md` (structured result)

Display progress:
```
  ◐ Running experiment...
    Setting up environment
    Writing test code
    Executing...
    Collecting results
```
</step>

<step name="report">
Read VERDICT.md and display:

**If VALIDATED:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Spike #{N}: VALIDATED                                  │
│                                                            │
│  Hypothesis   {hypothesis}                                 │
│                                                            │
│  Evidence:                                                 │
│    • {key finding 1}                                       │
│    • {key finding 2}                                       │
│                                                            │
│  Implications:                                             │
│    • {what this means for the plan}                        │
│                                                            │
│  Files:  .planning/spikes/{N}-{slug}/                      │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-spike-wrap-up {N}     feed into planning
    → /gtd-plan-phase {phase}    plan with confidence
```

**If INVALIDATED:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✗ Spike #{N}: INVALIDATED                                │
│                                                            │
│  Hypothesis   {hypothesis}                                 │
│                                                            │
│  Why it failed:                                            │
│    • {reason 1}                                            │
│    • {reason 2}                                            │
│                                                            │
│  Alternative approaches:                                   │
│    • {suggestion 1}                                        │
│    • {suggestion 2}                                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-spike "{alternative hypothesis}"
    → /gtd-discuss-phase {N}    rethink approach
```
</step>

</process>

<error_handling>
- Experiment crashes → record the crash as evidence, still produce VERDICT
- Time-box exceeded → force INCONCLUSIVE verdict, note what was tested
- Missing dependencies → note in VERDICT as a discovery
</error_handling>
