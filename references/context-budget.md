# Context Window Budget Allocation

> Rules for distributing context tokens across agents in the forward pipeline.

---

## Window Sizes

| Model Tier | Total Window | Usable (after system prompt) | Available for Allocation |
|-----------|-------------|-------|----------|
| Standard (200K) | 200,000 tokens | ~185,000 tokens | ~170,000 tokens |
| Extended (1M) | 1,000,000 tokens | ~970,000 tokens | ~950,000 tokens |

**Reserved overhead per agent:**
- System prompt: ~10,000 tokens
- Tool definitions: ~5,000 tokens
- Response buffer: ~15,000 tokens

---

## Budget Allocation: 200K Window

### Research Agents

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Project context | 5,000 | 3% | PROJECT.md + REQUIREMENTS.md |
| Research instructions | 3,000 | 2% | Task prompt + output format |
| Working space | 22,000 | 13% | Agent reasoning + drafting |
| **Total per agent** | **30,000** | **18%** | |

Max parallel research agents at 200K: **3** (90K used, 80K reserved for orchestrator)

### Planning Agent

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Project context | 5,000 | 3% | PROJECT.md + REQUIREMENTS.md |
| Research results | 30,000 | 18% | All research/*.md files |
| Planning instructions | 5,000 | 3% | Planning config + templates |
| Working space | 40,000 | 24% | Roadmap generation + phase prompts |
| **Total** | **80,000** | **47%** | |

### Execution Agent (per phase)

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Phase prompt | 5,000 | 3% | PROMPT.md for this phase |
| Phase context | 3,000 | 2% | CONTEXT.md for this phase |
| Project context | 3,000 | 2% | PROJECT.md (condensed) |
| Prior phase artifacts | 10,000 | 6% | Key files from previous phases |
| Code generation space | 50,000 | 29% | Writing and editing code |
| Verification output | 10,000 | 6% | Test results, build output |
| **Total** | **81,000** | **48%** | |

### Gate Agent

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Gate criteria | 2,000 | 1% | Gate prompt + requirements subset |
| Phase output | 15,000 | 9% | Files to verify |
| Verification results | 5,000 | 3% | Command output |
| **Total** | **22,000** | **13%** | |

---

## Budget Allocation: 1M Window

### Research Agents

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Project context | 10,000 | 1% | Full PROJECT.md + REQUIREMENTS.md |
| Research instructions | 5,000 | 0.5% | Detailed task prompt |
| Reference material | 50,000 | 5% | Documentation, examples |
| Working space | 85,000 | 9% | Deep analysis + drafting |
| **Total per agent** | **150,000** | **15%** | |

Max parallel research agents at 1M: **5** (750K used, 200K reserved)

### Planning Agent

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Project context | 10,000 | 1% | Full project docs |
| Research results | 100,000 | 10% | All research with full detail |
| Planning instructions | 10,000 | 1% | Full config + all templates |
| Prior plans (revision) | 50,000 | 5% | Previous plan versions |
| Working space | 130,000 | 14% | Detailed roadmap + phase prompts |
| **Total** | **300,000** | **32%** | |

### Execution Agent (per phase)

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Phase prompt | 10,000 | 1% | Detailed PROMPT.md |
| Phase context | 10,000 | 1% | Full CONTEXT.md with history |
| Project context | 10,000 | 1% | Full PROJECT.md |
| Prior phase artifacts | 80,000 | 8% | All relevant prior code |
| Research reference | 30,000 | 3% | Relevant research excerpts |
| Code generation space | 150,000 | 16% | Large codebases, refactoring |
| Verification output | 30,000 | 3% | Full test + build output |
| **Total** | **320,000** | **34%** | |

### Gate Agent

| Allocation | Tokens | Percentage | Contents |
|-----------|--------|------------|----------|
| Gate criteria | 5,000 | 0.5% | Full gate prompt |
| Phase output | 60,000 | 6% | All phase files |
| Requirements trace | 10,000 | 1% | Full requirements doc |
| Verification results | 15,000 | 1.5% | Full command output |
| **Total** | **90,000** | **9%** | |

---

## Budget Overflow Rules

When content exceeds the allocated budget:

| Priority | Action |
|----------|--------|
| 1 | Truncate research reference material first |
| 2 | Summarize prior phase artifacts (keep interfaces, drop implementation) |
| 3 | Condense project context to essential decisions only |
| 4 | Reduce working space (agent will produce shorter output) |
| Never | Remove phase prompt or gate criteria |

### Summarization Triggers

| Content Type | Summarize When Exceeds |
|-------------|----------------------|
| Research file | 8,000 tokens |
| Prior phase code | 15,000 tokens |
| Verification output | 5,000 tokens |
| Context history | 10,000 tokens |

---

## Monitoring

Track these metrics per agent invocation:

| Metric | Warning Threshold | Action |
|--------|------------------|--------|
| Input tokens used | > 80% of allocation | Log warning |
| Output tokens used | > 90% of response buffer | May truncate |
| Total tokens (in + out) | > 95% of window | Next invocation uses summarized context |
