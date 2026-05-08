<purpose>
Generate a detailed UI specification for a phase — bridging design decisions to
implementation details. Covers component hierarchy, state, accessibility, responsive
behavior, and edge cases.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-ui-spec-writer — Generates the UI specification document
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init ui-phase "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, git, args.
If no phase specified, use current from STATE.md.
</step>

<step name="gather_context">
Load context for the UI spec writer:
1. ROADMAP.md → phase description
2. REQUIREMENTS.md → relevant UI requirements
3. {phase}-CONTEXT.md → decisions about UI approach
4. Sketch decisions (if .planning/sketches/ has relevant entries)
5. CODEBASE-MAP.md → existing component inventory
6. Design system files (tailwind.config, theme.ts, etc.)
</step>

<step name="generate_spec">
Spawn gtd-ui-spec-writer with gathered context.

Display progress:
```
  ◐ Generating UI spec for Phase {N}...
    Inventorying screens
    Defining component hierarchy
    Mapping state requirements
    Accessibility audit
    Responsive breakpoints
```
</step>

<step name="report">
Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ UI Spec generated                                      │
│                                                            │
│  Phase        {N} — {name}                                 │
│  Screens      {count}                                      │
│  Components   {count} ({reused} reusable)                  │
│  A11y rules   {count}                                      │
│                                                            │
│  Written to:                                               │
│    .planning/phases/{N}/{N}-UI-SPEC.md                      │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-plan-phase {N}       plan implementation
    → /gtd-execute-phase {N}    execute (spec feeds executor)
    → /gtd-sketch "..."         mockup a specific screen
```
</step>

</process>
