# Quality Gate Definitions

> Gate prompts for the forward pipeline. Each gate type has a specific trigger, evaluation criteria, and outcome set.

---

## Gate Types Overview

| Gate | Purpose | Triggered By | Blocks Pipeline |
|------|---------|-------------|-----------------|
| Pre-flight | Verify phase is ready to execute | Before each phase starts | Yes |
| Revision | Plan needs rework | Gate failure or user feedback | Yes |
| Escalation | Human decision required | Agent uncertainty or conflict | Yes |
| Abort | Critical unrecoverable issue | Repeated failures or safety concern | Yes (terminal) |

---

## Gate 1: Pre-flight

**Trigger:** Automatically before each phase execution begins.

**Purpose:** Ensure all prerequisites are met before spending tokens on execution.

### Checklist

| Check | Pass Condition | Failure Action |
|-------|---------------|----------------|
| Phase prompt exists | `phases/phase-N/PROMPT.md` is non-empty | Generate from template |
| Context file exists | `phases/phase-N/CONTEXT.md` is non-empty | Generate from template |
| Dependencies available | All files listed in Dependencies section exist | Block until dependency phase completes |
| Prior phase verified | Previous phase passed its gate | Block until prior gate passes |
| Budget check | Estimated tokens fit within allocation | Reduce scope or split phase |

### Pre-flight Prompt Template

```
You are a pre-flight gate checker. Verify the following for Phase {{phase_number}}:

1. Read phases/phase-{{phase_number}}/PROMPT.md - Does it contain a clear goal, tasks, and verification commands?
2. Read phases/phase-{{phase_number}}/CONTEXT.md - Does it contain decisions relevant to this phase?
3. Check that each file in the Dependencies section exists and is non-empty.
4. Verify the previous phase (if any) has status "complete" in ROADMAP.md.

Output: PASS or FAIL with specific reasons.
```

### Outcomes

| Result | Action |
|--------|--------|
| PASS | Proceed to phase execution |
| FAIL (missing files) | Generate missing files from templates, re-check |
| FAIL (dependency) | Wait or re-order phases |
| FAIL (budget) | Split phase or summarize context |

---

## Gate 2: Revision

**Trigger:** A post-execution gate fails, OR the user requests changes to the plan.

**Purpose:** Rework the plan without restarting from scratch.

### Revision Scope Levels

| Level | Scope | When Used |
|-------|-------|-----------|
| Patch | Single phase task adjustment | Minor verification failure |
| Phase | Rewrite one phase prompt and re-execute | Phase output incorrect |
| Plan | Regenerate roadmap from current state | User changes direction |
| Full | Re-run research + planning | Fundamental assumption was wrong |

### Revision Prompt Template

```
You are a revision gate. A failure occurred at Phase {{phase_number}}.

Failure details:
{{failure_description}}

Current plan state:
{{roadmap_summary}}

Determine the minimum revision scope needed:
- PATCH: Adjust one task within the phase and re-run
- PHASE: Rewrite the phase prompt and re-execute from scratch
- PLAN: Regenerate the roadmap from Phase {{phase_number}} onward
- FULL: Flag for complete re-planning (requires user confirmation)

Output: Revision level + specific changes needed.
```

### Revision Rules

1. Always try PATCH first
2. Escalate to PHASE only if PATCH failed or the phase goal itself is wrong
3. Escalate to PLAN only if multiple phases are affected
4. FULL revision requires explicit user approval

---

## Gate 3: Escalation

**Trigger:** Agent encounters a decision it cannot make autonomously.

**Purpose:** Route the decision to the user with clear options.

### Escalation Categories

| Category | Example | Urgency |
|----------|---------|---------|
| Technical ambiguity | Two valid approaches, no clear winner | Medium |
| Scope question | Feature touches out-of-scope area | High |
| Constraint conflict | Two constraints contradict each other | High |
| Resource decision | Paid service needed, budget unclear | Medium |
| Quality trade-off | Ship faster vs. better test coverage | Low |

### Escalation Prompt Template

```
You are an escalation gate. An agent has flagged a decision it cannot make.

Decision needed:
{{decision_description}}

Options:
{{option_list}}

For each option, provide:
1. What changes in the plan
2. Impact on timeline
3. Impact on quality
4. Your recommendation and why

Format the output as a clear question for the user with numbered options.
```

### Escalation Format (User-Facing)

```markdown
## Decision Needed

**Context:** {{context}}

**Options:**
1. **{{option_1_name}}** - {{option_1_description}}
   - Timeline impact: {{impact}}
   - Trade-off: {{trade_off}}

2. **{{option_2_name}}** - {{option_2_description}}
   - Timeline impact: {{impact}}
   - Trade-off: {{trade_off}}

**Recommendation:** Option {{N}} because {{reason}}

Which would you prefer? (Enter 1 or 2, or describe an alternative)
```

---

## Gate 4: Abort

**Trigger:** Unrecoverable failure or safety concern.

**Purpose:** Stop the pipeline cleanly and preserve work done so far.

### Abort Conditions

| Condition | Detection | Auto-Abort |
|-----------|-----------|------------|
| 3 consecutive phase failures | Retry counter exceeds max | Yes |
| Security vulnerability detected | Gate agent flags unsafe code | Yes |
| Budget exhausted | Token tracking exceeds limit | Yes |
| User requests stop | User input during execution | Yes |
| Contradictory requirements | Planner cannot resolve conflict | No (escalate first) |

### Abort Prompt Template

```
You are an abort gate. A critical condition has been detected.

Condition: {{abort_condition}}
Phase: {{current_phase}}
Work completed: {{completed_phases}}

Perform these actions:
1. Document what was completed successfully
2. Document what failed and why
3. List all artifacts produced so far
4. Suggest recovery options for the user

Output an ABORT REPORT.
```

### Abort Report Format

```markdown
## Pipeline Aborted

**Reason:** {{abort_reason}}
**Failed at:** Phase {{phase_number}} - {{phase_name}}

### Completed Work
| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 1 | Complete | {{artifacts}} |
| Phase 2 | Complete | {{artifacts}} |
| Phase 3 | Failed | {{partial_artifacts}} |

### Recovery Options
1. {{recovery_option_1}}
2. {{recovery_option_2}}
3. {{recovery_option_3}}
```

---

## Gate Execution Order

For each phase in the pipeline:

```
[Pre-flight Gate] --> PASS --> [Execute Phase] --> [Post-Execution Verification]
       |                                                    |
       v FAIL                                               v FAIL
  [Fix & Re-check]                                    [Revision Gate]
                                                            |
                                                     PATCH/PHASE/PLAN
                                                            |
                                                   [Re-execute or Re-plan]
                                                            |
                                                     Still failing?
                                                            |
                                                      [Escalation Gate]
                                                            |
                                                     Still failing?
                                                            |
                                                       [Abort Gate]
```
