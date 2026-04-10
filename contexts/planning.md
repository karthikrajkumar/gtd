# Context Profile: Planning

> Loaded by planning agents (roadmapper, planner, plan-checker).

## Required Context
- `.planning/PROJECT.md` — Project vision, constraints
- `.planning/REQUIREMENTS.md` — Requirements with IDs
- `.planning/ROADMAP.md` — Phase breakdown
- `.planning/research/SUMMARY.md` — Research synthesis
- Phase `CONTEXT.md` — User decisions for this phase
- Phase `RESEARCH.md` — Phase-specific research findings
- Existing source code (for brownfield/later phases)

## References to Load
- `@references/planning-config.md` — Granularity, depth, sizing rules
- `@references/agent-contracts.md` — Result protocol
- `@references/gate-prompts.md` — Quality gates

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
PROJECT.md + REQUIREMENTS.md:     15K  (7.5%)
ROADMAP.md:                        5K  (2.5%)
Research (SUMMARY + phase):       20K  (10%)
CONTEXT.md:                        5K  (2.5%)
Source code (brownfield):         30K  (15%)
Reserved for plan output:         40K  (20%)
Buffer:                           80K  (40%)
```

## Tool Permissions
Planning agents: Read, Write, Bash, Grep, Glob (planner has Write for plan output)
Plan-checker: Read, Bash, Grep, Glob (read-only — only produces PASS/FAIL verdict)
