<purpose>
Close the current milestone — verify all phases complete, generate summary, archive.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init complete-milestone "$ARGUMENTS")
```
Parse: state, roadmap.
</step>

<step name="verify_all_complete">
Check ROADMAP.md: are all phases marked complete?
If not: display which phases remain, ask to proceed anyway or complete them first.
</step>

<step name="generate_summary">
Create .planning/milestones/{milestone-name}-SUMMARY.md:
- Phases completed, tasks executed, tests passed
- Requirements coverage
- Timeline and cost metrics
</step>

<step name="archive">
Archive current milestone state.
Update STATE.md: reset forward.current_phase.
Optionally trigger backward pipeline: /gtd-create-all (generate fresh docs for the completed milestone).
</step>

<step name="report">
Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Milestone {name} complete                              │
│                                                            │
│  Phases        {count} executed                            │
│  Requirements  {covered}/{total} delivered                 │
│  Commits       {total_commits}                             │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-new-milestone   start next milestone
    → /gtd-create-all      generate documentation for this milestone
```
</step>

</process>
