# {{project_name}} - Project Definition

> Generated: {{timestamp}}
> Pipeline: Forward (Dream-to-Deploy)

---

## Project Vision

**One-liner:** {{vision_oneliner}}

**Full Description:**
{{vision_description}}

**Target Users:**
{{target_users}}

**Success Criteria:**
- {{success_criterion_1}}
- {{success_criterion_2}}
- {{success_criterion_3}}

---

## Technical Decisions

| Decision | Choice | Rationale | Decided By |
|----------|--------|-----------|------------|
| Language/Runtime | {{language}} | {{language_rationale}} | {{decision_source}} |
| Framework | {{framework}} | {{framework_rationale}} | {{decision_source}} |
| Database | {{database}} | {{database_rationale}} | {{decision_source}} |
| Hosting | {{hosting}} | {{hosting_rationale}} | {{decision_source}} |
| Auth Strategy | {{auth_strategy}} | {{auth_rationale}} | {{decision_source}} |

### Additional Technical Choices

{{additional_technical_decisions}}

---

## Constraints

### Hard Constraints (Non-Negotiable)
- **Budget:** {{budget_constraint}}
- **Timeline:** {{timeline_constraint}}
- **Platform:** {{platform_constraint}}

### Soft Constraints (Prefer but Flexible)
- {{soft_constraint_1}}
- {{soft_constraint_2}}

### External Dependencies
- {{external_dependency_1}}
- {{external_dependency_2}}

---

## Evolution Rules

These rules govern how this document changes over time.

1. **Immutable after planning:** Vision and Hard Constraints lock after the planning phase completes.
2. **Technical Decisions** may be revised during research if evidence warrants it. Log all changes in the decision table with updated rationale.
3. **Soft Constraints** may be relaxed by the user at any quality gate.
4. **New constraints** discovered during execution are added to this document and trigger a plan revision gate.

### Change Log

| Date | Section | Change | Reason |
|------|---------|--------|--------|
| {{timestamp}} | All | Initial creation | Forward pipeline init |
