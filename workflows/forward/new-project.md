<purpose>
Initialize a new project through unified flow: adaptive questioning, parallel research, requirements extraction, and phased roadmap generation. This is the most leveraged moment in any project — deep questioning here means better plans, better execution, better outcomes.
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
</step>

<step name="questioning">
If NOT --auto mode:
  Conduct adaptive questioning guided by references/questioning.md:
  1. What are you building? (product type detection)
  2. Who is it for? (user/audience)
  3. What's the core problem it solves?
  4. Technical preferences? (language, framework, infrastructure)
  5. Constraints? (timeline, budget, team size, compliance)
  6. What does success look like?
  
  Use the "anything else?" pattern at natural pauses.
  Adapt question depth based on detected complexity.

If --auto mode with @file:
  Extract all context from the provided document.
  Skip interactive questioning.
</step>

<step name="config_preferences">
Ask (or use defaults in auto mode):
1. Planning granularity: coarse (3-5 phases), standard (5-8), fine (8-12)?
2. Enable research agents? (yes/no — default yes)
3. Git branching strategy? (phase-branch, feature-branch, trunk)
</step>

<step name="research" if="research_enabled">
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
</step>

<step name="extract_requirements">
From user answers + research findings:
  - Extract requirements into v1 (must-have), v2 (future), out-of-scope
  - Assign unique IDs: REQ-{CATEGORY}-{NUMBER}
  - Write to .planning/REQUIREMENTS.md
  
Present requirements for user approval.
</step>

<step name="generate_roadmap">
Spawn gtd-roadmapper agent:
  - Reads PROJECT.md, REQUIREMENTS.md, research/SUMMARY.md
  - Creates phased roadmap based on granularity setting
  - Maps each phase to requirement IDs
  - Writes .planning/ROADMAP.md

Present roadmap for user approval.
</step>

<step name="create_project_file">
Write .planning/PROJECT.md with:
  - Project vision (from questioning)
  - Technical decisions
  - Constraints
  - Evolution rules

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
  Requirements: {v1_count} v1, {v2_count} v2
  Phases: {count} (granularity: {setting})
  Research: {status}

  Next: /gtd-discuss-phase 1 (lock in preferences for Phase 1)
        /gtd-plan-phase 1 (skip discussion, go straight to planning)
```
</step>

</process>
