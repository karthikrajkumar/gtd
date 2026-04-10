# Phase {{phase_number}} Execution Prompt: {{phase_name}}

> Project: {{project_name}}
> Generated: {{timestamp}}
> Executor: {{executor_agent_type}}

---

## Phase Goal

{{phase_goal_description}}

**Success condition:** {{success_condition}}

**Boundary:** This phase ONLY covers the following requirements:
{{phase_requirements_list}}

Do NOT implement anything outside these requirements. If you discover a need for something not listed, write it to `CONTEXT.md` as an open question and continue.

---

## Tasks

Execute these tasks in order. Each task should produce verifiable output.

### Task 1: {{task_1_name}}

- **Action:** {{task_1_action}}
- **Input:** {{task_1_input}}
- **Output:** {{task_1_output}}
- **Verification:** {{task_1_verification}}

### Task 2: {{task_2_name}}

- **Action:** {{task_2_action}}
- **Input:** {{task_2_input}}
- **Output:** {{task_2_output}}
- **Verification:** {{task_2_verification}}

### Task 3: {{task_3_name}}

- **Action:** {{task_3_action}}
- **Input:** {{task_3_input}}
- **Output:** {{task_3_output}}
- **Verification:** {{task_3_verification}}

---

## Verification Commands

Run these commands after completing all tasks. ALL must pass before marking the phase complete.

```bash
# Build check
{{build_command}}

# Test suite
{{test_command}}

# Lint / format
{{lint_command}}

# Custom verification
{{custom_verification_command}}
```

### Expected Results

| Command | Expected Output | Failure Action |
|---------|----------------|----------------|
| Build | Exit code 0, no errors | Fix build errors before proceeding |
| Tests | All passing, coverage >= {{coverage_threshold}} | Fix failures, do not skip tests |
| Lint | No errors (warnings OK) | Fix lint errors |
| Custom | {{custom_expected}} | {{custom_failure_action}} |

---

## Dependencies

### From Previous Phases

| Artifact | Source Phase | Location | Required By Task |
|----------|-------------|----------|-----------------|
| {{artifact_name}} | Phase {{source_phase}} | {{file_path}} | Task {{task_number}} |

### External Dependencies

| Dependency | Version | Install Command |
|-----------|---------|----------------|
| {{dependency_name}} | {{version}} | {{install_command}} |

---

## Context Files

Read these files before starting execution:

1. `PROJECT.md` - Project vision and constraints
2. `phases/phase-{{phase_number}}/CONTEXT.md` - Decisions and preferences for this phase
3. {{additional_context_files}}

---

## Guardrails

- Do NOT modify files outside the scope of this phase unless fixing a broken import
- Do NOT change the public API of artifacts from previous phases
- Do NOT install dependencies not listed above without logging to CONTEXT.md
- If blocked for more than 2 attempts on a single task, write the blocker to CONTEXT.md and move on
