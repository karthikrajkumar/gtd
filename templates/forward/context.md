# Phase {{phase_number}} Context: {{phase_name}}

> Captured: {{timestamp}}
> Phase Status: {{phase_status}}
> Last Updated By: {{updated_by}}

---

## Decisions

Choices made during or before this phase that affect execution.

| ID | Decision | Options Considered | Choice | Rationale | Reversible |
|----|----------|--------------------|--------|-----------|------------|
| DEC-{{phase_number}}-01 | {{decision_topic}} | {{options}} | {{chosen_option}} | {{rationale}} | {{yes_no}} |
| DEC-{{phase_number}}-02 | {{decision_topic}} | {{options}} | {{chosen_option}} | {{rationale}} | {{yes_no}} |
| DEC-{{phase_number}}-03 | {{decision_topic}} | {{options}} | {{chosen_option}} | {{rationale}} | {{yes_no}} |

---

## Preferences

User-expressed preferences that guide implementation style but are not hard requirements.

| Preference | Value | Source |
|-----------|-------|--------|
| Code style | {{code_style}} | {{source}} |
| Naming convention | {{naming_convention}} | {{source}} |
| Error handling approach | {{error_handling}} | {{source}} |
| Testing preference | {{testing_pref}} | {{source}} |
| Verbosity level | {{verbosity}} | {{source}} |

### Implicit Preferences

Preferences inferred from user behavior or prior phases (not explicitly stated).

- {{implicit_preference_1}}
- {{implicit_preference_2}}

---

## Open Questions

Unresolved items that may need escalation or user input.

| ID | Question | Impact | Blocking | Proposed Default |
|----|----------|--------|----------|-----------------|
| OQ-{{phase_number}}-01 | {{question}} | {{impact_description}} | {{yes_no}} | {{default_answer}} |
| OQ-{{phase_number}}-02 | {{question}} | {{impact_description}} | {{yes_no}} | {{default_answer}} |

### Resolution Log

| Question ID | Resolution | Resolved By | Date |
|------------|------------|-------------|------|
| OQ-{{phase_number}}-01 | {{resolution}} | {{resolver}} | {{date}} |

---

## Carry-Forward

Items from this phase that the next phase must be aware of.

- **Technical debt introduced:** {{tech_debt}}
- **Assumptions made:** {{assumptions}}
- **Artifacts produced:** {{artifact_list}}
