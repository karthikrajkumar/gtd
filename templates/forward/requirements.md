# {{project_name}} - Requirements

> Generated: {{timestamp}}
> Source: Dream extraction + research synthesis
> Status: {{requirements_status}}

---

## v1 - Must-Have (MVP)

These requirements define the minimum viable product. All must pass verification before v1 ships.

| ID | Requirement | Category | Acceptance Criteria | Phase |
|----|-------------|----------|---------------------|-------|
| REQ-MVP-01 | {{requirement_description}} | {{category}} | {{acceptance_criteria}} | {{phase_id}} |
| REQ-MVP-02 | {{requirement_description}} | {{category}} | {{acceptance_criteria}} | {{phase_id}} |
| REQ-MVP-03 | {{requirement_description}} | {{category}} | {{acceptance_criteria}} | {{phase_id}} |
| REQ-MVP-04 | {{requirement_description}} | {{category}} | {{acceptance_criteria}} | {{phase_id}} |
| REQ-MVP-05 | {{requirement_description}} | {{category}} | {{acceptance_criteria}} | {{phase_id}} |

### v1 Verification Checklist

- [ ] All REQ-MVP items have acceptance criteria
- [ ] Each requirement maps to exactly one phase
- [ ] No circular dependencies between requirements
- [ ] User confirmed priority ordering

---

## v2 - Future Enhancements

These are acknowledged but explicitly deferred. They do NOT block v1 delivery.

| ID | Requirement | Category | Rationale for Deferral |
|----|-------------|----------|----------------------|
| REQ-FUT-01 | {{requirement_description}} | {{category}} | {{deferral_reason}} |
| REQ-FUT-02 | {{requirement_description}} | {{category}} | {{deferral_reason}} |
| REQ-FUT-03 | {{requirement_description}} | {{category}} | {{deferral_reason}} |

---

## Out of Scope

Explicitly excluded to prevent scope creep. If a requirement touches these areas, it triggers an escalation gate.

| ID | Excluded Item | Reason |
|----|--------------|--------|
| REQ-EXC-01 | {{excluded_item}} | {{exclusion_reason}} |
| REQ-EXC-02 | {{excluded_item}} | {{exclusion_reason}} |
| REQ-EXC-03 | {{excluded_item}} | {{exclusion_reason}} |

---

## Requirement Categories

Reference for the `Category` column above:

- **CORE** - Primary functionality
- **DATA** - Data models, storage, migrations
- **AUTH** - Authentication and authorization
- **UI** - User interface and experience
- **API** - External or internal API surface
- **INFRA** - Infrastructure, deployment, CI/CD
- **PERF** - Performance and scalability
- **SEC** - Security requirements

---

## Traceability

| Requirement | Source | Research Reference |
|------------|--------|-------------------|
| REQ-MVP-01 | {{source_type}} | {{research_file}} |
| REQ-MVP-02 | {{source_type}} | {{research_file}} |
