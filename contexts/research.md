# Context Profile: Research

> Loaded by research agents (project-researcher, phase-researcher, research-synthesizer).

## Required Context
- `.planning/PROJECT.md` — Project vision and scope (if exists)
- `.planning/REQUIREMENTS.md` — What needs to be built
- Phase `CONTEXT.md` — User decisions (for phase-level research)
- `.planning/config.json` → `planning` section

## References to Load
- `@references/questioning.md` — Dream extraction philosophy
- `@references/planning-config.md` — Research agent configuration

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
PROJECT.md + REQUIREMENTS.md:     10K  (5%)
CONTEXT.md (if phase research):    5K  (2.5%)
Web search results:               40K  (20%)
Reserved for research output:     40K  (20%)
Buffer:                          100K  (50%)  ← researchers need room for web content
```

## Tool Permissions
Research agents receive: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch
