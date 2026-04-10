# Planning Configuration Reference

> Controls how the forward pipeline decomposes projects into phases.

---

## Granularity Levels

The planner selects a granularity level based on project complexity.

| Level | Phase Count | Best For | Example |
|-------|------------|----------|---------|
| Coarse | 3-5 phases | Small projects, scripts, single-page apps | CLI tool, landing page |
| Standard | 5-8 phases | Medium apps, APIs with auth, CRUD apps | SaaS MVP, REST API |
| Fine | 8-12 phases | Complex systems, multi-service, real-time | Marketplace, dashboard suite |

### Auto-Detection Heuristics

| Signal | Points Toward |
|--------|--------------|
| < 5 requirements | Coarse |
| 5-15 requirements | Standard |
| > 15 requirements | Fine |
| Single data model | Coarse |
| 3-6 data models | Standard |
| > 6 data models or relations | Fine |
| No auth needed | Coarse |
| Basic auth (login/signup) | Standard |
| Role-based access, OAuth, multi-tenant | Fine |
| Static or read-only | Coarse |
| CRUD with validation | Standard |
| Real-time, webhooks, background jobs | Fine |

---

## Planning Depth

How much detail goes into each phase definition.

| Depth | Description | When to Use |
|-------|-------------|-------------|
| Skeleton | Phase names + one-line goals only | Early brainstorming, user wants quick overview |
| Standard | Goals + task list + verification commands | Default for most projects |
| Detailed | Full phase prompts with file paths, dependencies, code patterns | Complex projects or when user requests it |

---

## Research Agent Configuration

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `research_agent_count` | 3 | 1-5 | Number of parallel research agents |
| `research_timeout_ms` | 120000 | 30000-300000 | Max time per research agent |
| `research_topics` | auto | - | Topics assigned to each agent |

### Default Research Topic Assignment

For `research_agent_count = 3`:

| Agent | Focus | Output File |
|-------|-------|-------------|
| Research Agent 1 | Stack + compatibility | `research/STACK.md` |
| Research Agent 2 | Feature patterns + architecture | `research/FEATURES.md`, `research/ARCHITECTURE.md` |
| Research Agent 3 | Pitfalls + risk analysis | `research/PITFALLS.md` |

For `research_agent_count = 5`:

| Agent | Focus | Output File |
|-------|-------|-------------|
| Research Agent 1 | Stack selection | `research/STACK.md` |
| Research Agent 2 | Feature patterns | `research/FEATURES.md` |
| Research Agent 3 | Architecture | `research/ARCHITECTURE.md` |
| Research Agent 4 | Pitfalls + failure modes | `research/PITFALLS.md` |
| Research Agent 5 | Performance + security | `research/PERFORMANCE.md` |

---

## Discussion Modes

How the planner interacts with the user during plan creation.

| Mode | Behavior | Trigger |
|------|----------|---------|
| Auto | Generate plan, present for approval | User says "just do it" or provides detailed brief |
| Collaborative | Present plan outline, ask for feedback per phase | Default mode |
| Guided | Walk through each phase interactively | User seems uncertain or project is ambiguous |

### Mode Selection

```
if user_brief.completeness > 0.8:
    mode = "auto"
elif user_brief.completeness > 0.5:
    mode = "collaborative"
else:
    mode = "guided"
```

---

## Phase Sizing Rules

| Rule | Description |
|------|-------------|
| Single responsibility | Each phase does ONE category of work |
| Verifiable | Every phase has at least one verification command |
| Independent failure | A phase failure should not corrupt prior phase output |
| Max 5 tasks | If a phase has > 5 tasks, split it |
| Max 30 min estimate | If estimated > 30 min agent time, split it |

---

## Configuration Override

Users can override defaults by specifying in the dream extraction:

```markdown
## Planning Overrides
- Granularity: fine
- Depth: detailed
- Research agents: 5
- Discussion mode: auto
```

These overrides are recorded in `PROJECT.md` under Technical Decisions.
