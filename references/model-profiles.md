# Model Profiles

> Token budget and model selection guidance for GTD agents.

---

## Overview

GTD agents vary in complexity. Routing all agents to the same model wastes budget on simple tasks and under-serves complex ones. Model profiles define tiers that map agent roles to appropriate model capabilities.

---

## Tiers

### Tier 1: Fast (Mini/Flash)

**Use for:** Formatting, simple transforms, file operations, commit message generation.

| Property | Value |
|----------|-------|
| Token budget (output) | ≤ 2,000 |
| Max context window | 32K |
| Latency target | < 3s |
| Retry ceiling | 2 |

**Agents:** gtd-fast-executor, commit-message-generator

### Tier 2: Balanced (Sonnet/GPT-4o)

**Use for:** Planning, research, code generation, verification.

| Property | Value |
|----------|-------|
| Token budget (output) | ≤ 8,000 |
| Max context window | 128K |
| Latency target | < 15s |
| Retry ceiling | 3 |

**Agents:** gtd-researcher, gtd-planner, gtd-executor, gtd-verifier, gtd-quick-planner, gtd-pr-creator, gtd-session-manager

### Tier 3: Power (Opus/o1/DeepThink)

**Use for:** Architectural decisions, complex debugging, whole-system reasoning.

| Property | Value |
|----------|-------|
| Token budget (output) | ≤ 32,000 |
| Max context window | 200K |
| Latency target | < 60s |
| Retry ceiling | 2 |

**Agents:** gtd-architect (new-project deep mode), gtd-debugger (complex root-cause), cross-phase planner

---

## Configuration

Users can override the default profile in `.planning/config.json`:

```json
{
  "model_profiles": {
    "tier1": "claude-3-5-haiku",
    "tier2": "claude-sonnet-4-20250514",
    "tier3": "claude-opus-4-20250514"
  }
}
```

If no profile is configured, agents use whatever model the host IDE provides (Cursor, Copilot, etc.) — the tier metadata serves as a hint for context budgeting rather than explicit routing.

---

## Token Budgeting Rules

1. **Context first** — Reserve 60% of context window for input (files, state, plans)
2. **Output cap** — Never exceed the tier's output budget per agent call
3. **Sharding** — If input exceeds budget, shard across multiple agent calls
4. **Summarize** — When passing outputs between agents, summarize to ≤ 25% of original

---

## Cost Awareness

The implementation plan introduces these cost controls:

| Feature | How |
|---------|-----|
| Model fallback | If tier3 unavailable, fall back to tier2 with expanded context |
| Early termination | If agent produces DONE signal before budget, stop immediately |
| Context pruning | Strip comments, empty lines, and test files from context bundles |
| Dedup | Never pass the same file to an agent twice in one session |

---

## Agent ↔ Tier Mapping

| Agent | Default Tier | Notes |
|-------|-------------|-------|
| gtd-fast-executor | tier1 | Single-commit tasks |
| gtd-quick-planner | tier2 | ≤ 5 tasks, no deep research |
| gtd-researcher | tier2 | Parallel research agents |
| gtd-planner | tier2 | Plan generation |
| gtd-executor | tier2 | Code generation per task |
| gtd-verifier | tier2 | Requirement checking |
| gtd-pr-creator | tier2 | PR generation |
| gtd-session-manager | tier2 | Session serialize/restore |
| gtd-debugger | tier2/tier3 | Escalates on complexity |
| gtd-architect | tier3 | Deep new-project mode |
