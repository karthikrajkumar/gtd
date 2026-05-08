<purpose>
Create rapid HTML/CSS mockups for a feature or screen. Produces self-contained files
that open in a browser without any build step. Enables visual decision-making before
committing to implementation.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-sketch-designer — Creates HTML mockups and comparison notes
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init sketch "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract feature description, --options (default 2), --style.

Determine next sketch number:
```bash
SKETCH_NUM=$(ls .planning/sketches/ 2>/dev/null | wc -l | xargs expr 1 +)
SLUG=$(echo "$FEATURE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-40)
SKETCH_DIR=".planning/sketches/${SKETCH_NUM}-${SLUG}"
mkdir -p "$SKETCH_DIR"
```
</step>

<step name="context_gather">
If codebase exists, check for design context:
- Look for CSS variables, Tailwind config, theme files
- Check existing component patterns
- Note brand colors, typography, spacing

If --style not specified, auto-detect:
- Tailwind config present → use Tailwind CDN
- CSS modules / styled-components → use vanilla CSS matching patterns
- Nothing → use vanilla CSS with modern defaults
</step>

<step name="design">
Spawn gtd-sketch-designer with:
- Feature description
- Number of options
- Style preference
- Design context from codebase
- SKETCH_DIR for output

The designer creates:
1. `option-a.html` through `option-{n}.html`
2. `COMPARISON.md`

Display progress:
```
  ◐ Sketching {N} options...
    Option A: {approach name}
    Option B: {approach name}
    Writing comparison...
```
</step>

<step name="report">
Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Sketch #{N} complete                                   │
│                                                            │
│  Feature     {description}                                 │
│  Options     {count}                                       │
│                                                            │
│  A  {option-a name}                                        │
│  B  {option-b name}                                        │
│  {C  {option-c name}}                                      │
│                                                            │
│  Open in browser:                                          │
│    .planning/sketches/{N}-{slug}/option-a.html             │
│    .planning/sketches/{N}-{slug}/option-b.html             │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-sketch-wrap-up {N}    choose direction
    → /gtd-sketch "..."          try different feature
```
</step>

</process>

<error_handling>
- No design context found → use sensible modern defaults
- Too complex for a sketch → suggest breaking into multiple sketches
</error_handling>
