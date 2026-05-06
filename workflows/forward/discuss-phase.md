<purpose>
Capture user's implementation preferences and decisions for a specific phase before research and planning. Eliminates gray areas that cause the AI to guess during execution.
</purpose>

<required_reading>
@references/questioning.md
@references/output-style.md
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init discuss-phase "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, roadmap, phase_context.

Load ROADMAP.md → get phase description and requirements.
Check if {phase}-CONTEXT.md already exists → load prior decisions to avoid re-asking.
</step>

<step name="scout_codebase">
If code already exists (brownfield or previous phases completed):
  Read relevant source files to understand current state.
  Identify gray areas based on what's already implemented vs what's needed.
</step>

<step name="identify_gray_areas">
Analyze phase scope and identify decision points:

| Category | Example Decisions |
|----------|-------------------|
| Visual/UI | Layout, density, interactions, empty states |
| API/CLI | Response format, pagination, error handling |
| Data | Schema design, relationships, indexing |
| Organization | File structure, naming conventions |
| Integration | Third-party services, auth flow |
| Performance | Caching strategy, pagination limits |

Filter out decisions already made in prior CONTEXT.md files.
</step>

<step name="ask_questions">
If NOT --auto mode:
  Present gray areas grouped by category.
  For each, offer options with recommendations.
  Use --batch flag for grouped Q&A.

If --auto mode:
  Auto-select recommended defaults for all gray areas.
</step>

<step name="write_context">
Write decisions to .planning/phases/{phase}/{phase}-CONTEXT.md:

```markdown
---
phase: {number}
timestamp: {ISO 8601}
mode: {guided|auto}
---

# Phase {N} Context: {Phase Name}

## Decisions
| # | Area | Decision | Rationale |
|---|------|----------|-----------|
| 1 | ... | ... | ... |

## Preferences
...

## Open Questions (deferred)
...
```
</step>

<step name="report">
Display (per references/output-style.md completion block):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Phase {N} discussion complete                          │
│                                                            │
│  Decisions     {count} captured                            │
│  Deferred      {count} open questions                      │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-plan-phase {N}   research + create execution plan
```
</step>

</process>
