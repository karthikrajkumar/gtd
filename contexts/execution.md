# Context Profile: Execution

> Loaded by executor agents. Defines what context to provide when spawning code-writing agents.

## Required Context
- PLAN file assigned to this executor
- `.planning/PROJECT.md` — Project vision, constraints
- `.planning/REQUIREMENTS.md` — Requirements being implemented
- Phase `CONTEXT.md` — User decisions and preferences
- Phase `RESEARCH.md` — Implementation approach research
- Existing source files referenced in plan tasks

## References to Load
- `@references/agent-contracts.md` — Result protocol, commit conventions
- `@references/gate-prompts.md` — Pre-flight and revision gates

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
PLAN file:                         5K  (2.5%)
PROJECT.md + REQUIREMENTS.md:     10K  (5%)
CONTEXT.md + RESEARCH.md:         15K  (7.5%)
Existing source code reads:       60K  (30%)
Reserved for code output:         80K  (40%)
Buffer:                           25K  (12.5%)
```

## Tool Permissions
Executor agents receive: Read, Write, Edit, Bash, Grep, Glob (full code-writing capability)

## Git Integration
- Each task produces one atomic commit
- Commit message format: `feat(phase-N): <task description>`
- Never force push or amend previous commits
- Respect .gitignore
