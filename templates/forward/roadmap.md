# {{project_name}} - Roadmap

> Generated: {{timestamp}}
> Granularity: {{granularity_level}} ({{phase_count}} phases)
> Estimated Total: {{total_estimate}}

---

## Phase Overview

| Phase | Name | Description | Status | Requirements |
|-------|------|-------------|--------|--------------|
| 1 | {{phase_1_name}} | {{phase_1_description}} | {{phase_1_status}} | {{phase_1_requirements}} |
| 2 | {{phase_2_name}} | {{phase_2_description}} | {{phase_2_status}} | {{phase_2_requirements}} |
| 3 | {{phase_3_name}} | {{phase_3_description}} | {{phase_3_status}} | {{phase_3_requirements}} |
| 4 | {{phase_4_name}} | {{phase_4_description}} | {{phase_4_status}} | {{phase_4_requirements}} |
| 5 | {{phase_5_name}} | {{phase_5_description}} | {{phase_5_status}} | {{phase_5_requirements}} |

### Status Key

- `pending` - Not started
- `active` - Currently in execution
- `blocked` - Waiting on dependency or decision
- `review` - At quality gate
- `complete` - Verified and done
- `skipped` - Intentionally bypassed

---

## Dependency Graph

```
Phase 1: {{phase_1_name}}
  └─> Phase 2: {{phase_2_name}}
        └─> Phase 3: {{phase_3_name}}
              └─> Phase 4: {{phase_4_name}}
                    └─> Phase 5: {{phase_5_name}}
```

### Cross-Phase Dependencies

| Dependent Phase | Depends On | Artifact Needed |
|----------------|------------|-----------------|
| {{dependent_phase}} | {{dependency_phase}} | {{artifact}} |

---

## Phase Details

### Phase 1: {{phase_1_name}}

- **Goal:** {{phase_1_goal}}
- **Deliverables:** {{phase_1_deliverables}}
- **Gate:** {{phase_1_gate_type}}
- **Prompt file:** `phases/phase-1/PROMPT.md`
- **Context file:** `phases/phase-1/CONTEXT.md`

### Phase 2: {{phase_2_name}}

- **Goal:** {{phase_2_goal}}
- **Deliverables:** {{phase_2_deliverables}}
- **Gate:** {{phase_2_gate_type}}
- **Prompt file:** `phases/phase-2/PROMPT.md`
- **Context file:** `phases/phase-2/CONTEXT.md`

---

## Revision History

| Revision | Date | Phases Changed | Reason |
|----------|------|---------------|--------|
| 1 | {{timestamp}} | All | Initial plan |
