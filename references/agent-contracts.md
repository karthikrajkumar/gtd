# Agent Contracts

> Formal interface definitions between orchestrators and agents in the forward pipeline.

---

## Contract Overview

Every agent interaction follows this lifecycle:

```
Orchestrator --> [Spawn] --> Agent
Orchestrator --> [Context Bundle] --> Agent
Agent --> [File Artifacts] --> Orchestrator
Agent --> [Status Signal] --> Orchestrator
```

---

## Spawn Protocol

### How Orchestrators Spawn Agents

| Field | Required | Description |
|-------|----------|-------------|
| `agent_type` | Yes | One of: `research`, `planning`, `execution`, `gate` |
| `agent_id` | Yes | Unique identifier, format: `{{agent_type}}-{{sequence}}` |
| `task_description` | Yes | One-line description of what the agent must do |
| `context_files` | Yes | List of file paths the agent must read before starting |
| `output_files` | Yes | List of file paths the agent must produce |
| `timeout_ms` | No | Override default timeout (see defaults below) |
| `max_retries` | No | Override default retry count |

### Example Spawn

```json
{
  "agent_type": "research",
  "agent_id": "research-1",
  "task_description": "Analyze technology stack options for a React + Node.js SaaS app",
  "context_files": [
    "PROJECT.md",
    "REQUIREMENTS.md"
  ],
  "output_files": [
    "research/STACK.md"
  ],
  "timeout_ms": 120000,
  "max_retries": 1
}
```

---

## Context Bundle

What the agent receives when spawned.

| Agent Type | Always Receives | Conditionally Receives |
|-----------|----------------|----------------------|
| Research | PROJECT.md, REQUIREMENTS.md | Prior research outputs (if re-running) |
| Planning | PROJECT.md, REQUIREMENTS.md, research/* | User feedback (if revision) |
| Execution | PROJECT.md, phase CONTEXT.md, phase PROMPT.md | Prior phase artifacts |
| Gate | Phase output files, REQUIREMENTS.md | ROADMAP.md (for cross-phase gates) |

### Context Size Rules

- Total context bundle must fit within the agent's allocated token budget
- If context exceeds budget, orchestrator must summarize or truncate
- Priority order for truncation: research files > context files > requirements > project

---

## Result Protocol

### How Agents Return Results

Agents communicate results through file artifacts, not return values.

| Signal | Mechanism | Description |
|--------|-----------|-------------|
| Success | All `output_files` exist and are non-empty | Agent completed its task |
| Partial | Some `output_files` exist | Agent completed partially |
| Failure | No `output_files` created OR error marker file | Agent could not complete |
| Escalation | `ESCALATION.md` file created | Agent needs human decision |

### Result File Requirements

- Every output file must have a YAML-style header with `agent_id` and `timestamp`
- Files must be valid Markdown
- Files must not exceed 500 lines (split into multiple files if needed)
- Agent must not modify files outside its `output_files` list

---

## Timeout Handling

| Agent Type | Default Timeout | Max Timeout | On Timeout |
|-----------|----------------|-------------|------------|
| Research | 120s | 300s | Retry once, then mark partial |
| Planning | 180s | 300s | Retry once, then escalate |
| Execution | 300s | 600s | Retry once, then pause pipeline |
| Gate | 60s | 120s | Auto-fail the gate |

### Timeout Behavior

1. Orchestrator sends a soft cancellation signal at `timeout - 30s`
2. Agent should wrap up and write partial results
3. At timeout, orchestrator force-terminates the agent
4. Partial output files (if any) are preserved
5. Retry uses the same context bundle plus partial output as additional context

---

## Retry Policy

| Condition | Retry | Max Retries | Backoff |
|-----------|-------|-------------|---------|
| Timeout | Yes | 1 | None (immediate) |
| Output file missing | Yes | 1 | None |
| Output file empty | Yes | 1 | None |
| Agent error (crash) | Yes | 2 | 5s between retries |
| Escalation signal | No | - | Route to user |
| Gate failure | No | - | Route to revision |

### Retry Context

On retry, the agent receives the original context bundle plus:
- `_retry_reason`: Why the previous attempt failed
- `_partial_output`: Any files the previous attempt produced
- `_attempt_number`: Current attempt (1-indexed)

---

## Inter-Agent Communication

Agents do NOT communicate directly. All coordination flows through the orchestrator.

| Allowed | Not Allowed |
|---------|-------------|
| Agent writes to its output files | Agent reads another agent's in-progress files |
| Agent reads files listed in context_files | Agent spawns sub-agents |
| Agent creates ESCALATION.md | Agent modifies orchestrator state |
| Agent logs to its designated log path | Agent writes to shared directories |

---

## Escalation Protocol

When an agent encounters a decision it cannot make:

1. Create `ESCALATION.md` in the phase directory
2. Include: question, options, recommendation, impact of each option
3. Set status to `escalated`
4. Orchestrator pauses the pipeline and presents to user
5. User decision is recorded in CONTEXT.md
6. Agent is re-spawned with the decision in context
