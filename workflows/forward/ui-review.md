<purpose>
Review implemented UI against the UI specification. Checks accessibility, responsive
behavior, state handling, and design consistency. Produces an actionable review report.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-ui-reviewer — Reviews UI implementation against spec
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init ui-review "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, git, args.
</step>

<step name="load_spec">
Read `.planning/phases/{N}/{N}-UI-SPEC.md`.

If no spec exists:
```
  ✗ No UI spec found for Phase {N}

  Generate one first:
    → /gtd-ui-phase {N}
```
EXIT.
</step>

<step name="identify_ui_files">
From the spec's component hierarchy, identify implemented files:
- Search for component files (*.tsx, *.vue, *.svelte, etc.)
- Match components to spec entries
- Note any spec components not yet implemented
</step>

<step name="review">
Spawn gtd-ui-reviewer with:
- UI-SPEC.md
- List of implemented component files
- Design system references

Display progress:
```
  ◐ Reviewing UI implementation...
    Checking spec compliance
    Accessibility audit
    Responsive behavior
    Design consistency
```
</step>

<step name="report">
Read review output and display:

**If passing:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ UI Review passed                                       │
│                                                            │
│  Phase        {N} — {name}                                 │
│  Score        {passed}/{total} checks                      │
│  A11y         ✓ compliant                                  │
│  Responsive   ✓ all breakpoints                            │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

**If issues found:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ⚠ UI Review: {issues} issues found                       │
│                                                            │
│  Phase        {N} — {name}                                 │
│  Score        {passed}/{total} checks                      │
│                                                            │
│  Must fix ({critical_count}):                              │
│    • {a11y issue} — {file}:{line}                          │
│    • {missing state} — {file}:{line}                       │
│                                                            │
│  Should fix ({warning_count}):                             │
│    • {consistency issue}                                   │
│                                                            │
│  Full report:                                              │
│    .planning/phases/{N}/{N}-UI-REVIEW.md                    │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-debug           auto-fix critical issues
    → /gtd-execute-phase   re-execute with fixes
```
</step>

</process>
