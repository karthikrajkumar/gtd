# Technology Stack Research: {{project_name}}

> Researcher: {{agent_id}}
> Completed: {{timestamp}}
> Focus: Stack selection and compatibility analysis

---

## Proposed Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | {{runtime}} | {{version}} | {{purpose}} |
| Framework | {{framework}} | {{version}} | {{purpose}} |
| Database | {{database}} | {{version}} | {{purpose}} |
| ORM / Data Layer | {{orm}} | {{version}} | {{purpose}} |
| Auth | {{auth_lib}} | {{version}} | {{purpose}} |
| Testing | {{test_framework}} | {{version}} | {{purpose}} |
| Build Tool | {{build_tool}} | {{version}} | {{purpose}} |
| Deployment | {{deploy_target}} | {{version}} | {{purpose}} |

---

## Compatibility Matrix

| Component A | Component B | Compatible | Notes |
|------------|-------------|------------|-------|
| {{component_a}} | {{component_b}} | {{yes_no_partial}} | {{compatibility_notes}} |
| {{component_a}} | {{component_b}} | {{yes_no_partial}} | {{compatibility_notes}} |

---

## Stack Alternatives Evaluated

### Option A: {{stack_option_a_name}}

- **Pros:** {{option_a_pros}}
- **Cons:** {{option_a_cons}}
- **Best for:** {{option_a_best_for}}

### Option B: {{stack_option_b_name}}

- **Pros:** {{option_b_pros}}
- **Cons:** {{option_b_cons}}
- **Best for:** {{option_b_best_for}}

### Selection Rationale

{{stack_selection_rationale}}

---

## Version Constraints

| Dependency | Min Version | Max Version | Constraint Reason |
|-----------|-------------|-------------|-------------------|
| {{dependency}} | {{min_ver}} | {{max_ver}} | {{constraint_reason}} |
| {{dependency}} | {{min_ver}} | {{max_ver}} | {{constraint_reason}} |

---

## Package Inventory

Estimated npm/pip/cargo packages needed for v1:

| Package | Purpose | Size Impact | Required By Phase |
|---------|---------|-------------|-------------------|
| {{package_name}} | {{purpose}} | {{size_kb}} | Phase {{phase_num}} |
| {{package_name}} | {{purpose}} | {{size_kb}} | Phase {{phase_num}} |
| {{package_name}} | {{purpose}} | {{size_kb}} | Phase {{phase_num}} |

---

## Stack Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Version conflict between {{dep_a}} and {{dep_b}} | {{severity}} | {{mitigation}} |
| {{dep}} lacks feature {{feature}} | {{severity}} | {{mitigation}} |
| {{dep}} maintenance status | {{severity}} | {{mitigation}} |
