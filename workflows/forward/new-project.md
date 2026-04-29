<purpose>
Initialize a new project through an engaging, adaptive flow: vision exploration, competitive landscape, parallel research, requirements extraction, and phased roadmap generation. This is the most leveraged moment in any project — deep understanding here means better plans, better execution, better outcomes.

The experience should feel like working with a sharp co-founder — not filling out a form.
</purpose>

<required_reading>
@references/questioning.md
@references/planning-config.md
@references/agent-contracts.md
</required_reading>

<available_agent_types>
- gtd-project-researcher — Researches domain ecosystem (x4 parallel)
- gtd-research-synthesizer — Combines research findings
- gtd-roadmapper — Creates phased execution roadmap
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init new-project "$ARGUMENTS")
```
Parse: project_root, docs_root, config, state, git, codebase_map, args.

Check `--auto` flag for automated mode.
If .planning/PROJECT.md already exists → Error: "Project already initialized. Use /gtd-new-milestone for new milestone."
</step>

<step name="brownfield_check">
If codebase_map exists (from /gtd-scan or /gtd-map-codebase):
  Display: "Existing codebase detected. This will be a brownfield project — GTD will plan around your existing code."
  Load codebase context for research agents.
  Switch to assumptions-first mode: surface what you observe from the code instead of asking from scratch.
</step>

<step name="vision_exploration">
This is the MOST IMPORTANT step. Do NOT rush it.

If NOT --auto mode:
  Use the conversational style from references/questioning.md.
  
  **Phase A — The Dream (2-3 questions max)**
  Start with ONE open question. Let the user paint the picture:
    "Tell me what you're imagining. When this thing exists and works perfectly, what does it feel like to use it?"
  
  Then probe depth based on their response:
  - Terse answer → offer 2-3 concrete scenarios to react to ("Is it more like X, Y, or Z?")
  - Long answer → summarize in one sentence and confirm ("So the core is X — right?")
  - Uncertain → describe 2 possible products and ask which resonates
  
  **Phase B — The Why (1-2 questions)**
  "What's broken right now that makes you want this?"
  "What happens if this never gets built?"
  These surface motivation. Motivation shapes every priority decision downstream.
  
  **Phase C — The User (1-2 questions)**
  "Who's the first person that will use this besides you?"
  "What are they doing RIGHT BEFORE they open your app?"
  
  **Phase D — The Vibe (1-2 questions, adaptive)**
  Only ask if relevant (skip for CLIs, APIs, backend services):
  "Name an app or site that FEELS like what you want."
  "Minimal and clean, or feature-rich and powerful?"
  
  **Phase E — Constraints & Opinions (1-3 questions, adaptive)**
  Only ask what the user hasn't already mentioned:
  "Do you have a language/framework preference, or should I recommend one?"
  "Any hard constraints — timeline, budget, compliance, existing infrastructure?"
  "What should this explicitly NOT do?"
  
  **Phase F — The Catch-All**
  "Is there anything else that feels important that I haven't asked about?"
  
  Between phases, REACT to what the user says. Reflect back what you heard.
  Share a quick opinion or insight where relevant — be a collaborator, not an interviewer.
  Show you understand their domain by connecting their answers to known patterns.

If --auto mode with @file:
  Extract all context from the provided document.
  Map against the 5 categories (scope, users, technical, UX, constraints).
  For covered categories: confirm in one sentence.
  For partial: ask ONE targeted follow-up.
  For missing: ask the single most important question.
</step>

<step name="surface_assumptions">
Before moving to config, present a brief of what you understood:

```
Here's what I'm working with:

  Vision: [one sentence summary]
  Core problem: [what's broken]
  Users: [who + context]
  Tech direction: [stated or inferred preferences]
  Style: [aesthetic/UX if applicable]
  Constraints: [hard limits]
  
  Does this capture it? Anything to correct or add?
```

This is a confirmation gate. Wait for user approval before proceeding.
Do NOT skip this — it prevents cascade errors in research and planning.
</step>

<step name="config_preferences">
Ask (or use defaults in auto mode):
1. Planning granularity: coarse (3-5 phases), standard (5-8), fine (8-12)?
   Recommend a default based on project complexity detected during questioning.
2. Enable research agents? (yes/no — default yes)
   If the project is simple or well-understood, suggest skipping research.
3. Git branching strategy? (phase-branch, feature-branch, trunk)
</step>

<step name="research" if="research_enabled">
Display: "Spinning up 4 research agents in parallel. This takes a minute — they're investigating your stack, features, architecture, and common pitfalls."

Create .planning/research/ directory.
Spawn 4 parallel gtd-project-researcher agents:
  - Instance 1: STACK research → .planning/research/STACK.md
  - Instance 2: FEATURES research → .planning/research/FEATURES.md
  - Instance 3: ARCHITECTURE research → .planning/research/ARCHITECTURE.md
  - Instance 4: PITFALLS research → .planning/research/PITFALLS.md

Wait for all 4 to complete.

Spawn gtd-research-synthesizer:
  → Reads all 4 research files
  → Writes .planning/research/SUMMARY.md

After synthesis, present a brief of key findings and any surprises:
"Your research is in. Here are the highlights:
  - Stack: [key recommendation]
  - Watch out for: [top pitfall]
  - Architecture: [recommended pattern]
  Anything here surprise you or conflict with your thinking?"
</step>

<step name="extract_requirements">
From user answers + research findings:
  - Extract requirements into v1 (must-have), v2 (future), out-of-scope
  - Assign unique IDs: REQ-{CATEGORY}-{NUMBER}
  - Write to .planning/REQUIREMENTS.md
  
Present requirements organized by priority.
Explicitly call out what was EXCLUDED and why — this prevents scope creep later.
Wait for user approval. Allow them to move items between v1/v2/out-of-scope.
</step>

<step name="generate_roadmap">
Spawn gtd-roadmapper agent:
  - Reads PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md
  - Creates phased roadmap based on granularity setting
  - Maps each phase to requirement IDs
  - Writes .planning/ROADMAP.md

Present roadmap as a narrative, not just a table:
"Here's how I'd build this:
  Phase 1: {name} — {1-sentence description of what becomes real}
  Phase 2: {name} — {what this unlocks}
  ...
  After Phase {N}, you'll have a working {summary of v1 product}."

Wait for user approval. Allow reordering and phase merging/splitting.
</step>

<step name="create_project_file">
Write .planning/PROJECT.md with:
  - Project vision (from questioning — preserve the user's words where possible)
  - Technical decisions
  - Constraints
  - Evolution rules (how scope changes should be handled)

Write initial .planning/STATE.md.
Write .planning/config.json with user preferences.
</step>

<step name="finalize">
Update state:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status researched
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.current_milestone "v1.0"
```

Display:
```
✓ Project initialized!

  Project: {name}
  Vision: {one-sentence from user's own words}
  Requirements: {v1_count} must-haves, {v2_count} future, {excluded_count} out-of-scope
  Phases: {count} ({granularity} granularity)
  Research: {status}

  Next: /gtd-discuss-phase 1 — shape how Phase 1 gets built (recommended)
        /gtd-plan-phase 1   — skip discussion, go straight to planning
        /gtd-quick           — got a small task? do it now without full ceremony
```
</step>

</process>
