# Common Pitfalls: {{project_name}}

> Researcher: {{agent_id}}
> Completed: {{timestamp}}
> Focus: Failure modes, common mistakes, and preventive measures

---

## Critical Pitfalls

Issues that will cause project failure if not addressed.

### Pitfall 1: {{pitfall_1_name}}

- **Category:** {{architecture_integration_config_security_performance}}
- **Likelihood:** {{high_medium_low}}
- **Impact:** {{high_medium_low}}
- **Symptoms:** {{symptoms}}
- **Root Cause:** {{root_cause}}
- **Prevention:** {{prevention_steps}}
- **Detection:** {{how_to_detect}}

### Pitfall 2: {{pitfall_2_name}}

- **Category:** {{category}}
- **Likelihood:** {{high_medium_low}}
- **Impact:** {{high_medium_low}}
- **Symptoms:** {{symptoms}}
- **Root Cause:** {{root_cause}}
- **Prevention:** {{prevention_steps}}
- **Detection:** {{how_to_detect}}

---

## Stack-Specific Pitfalls

Issues specific to the chosen technology stack.

| Technology | Pitfall | Severity | Workaround |
|-----------|---------|----------|------------|
| {{technology}} | {{pitfall_description}} | {{critical_warning_info}} | {{workaround}} |
| {{technology}} | {{pitfall_description}} | {{critical_warning_info}} | {{workaround}} |
| {{technology}} | {{pitfall_description}} | {{critical_warning_info}} | {{workaround}} |
| {{technology}} | {{pitfall_description}} | {{critical_warning_info}} | {{workaround}} |

---

## Integration Pitfalls

Issues that arise when components interact.

| Component A | Component B | Failure Mode | Fix |
|------------|-------------|-------------|-----|
| {{comp_a}} | {{comp_b}} | {{failure_description}} | {{fix}} |
| {{comp_a}} | {{comp_b}} | {{failure_description}} | {{fix}} |

---

## Configuration Pitfalls

| Setting | Wrong Value | Correct Value | Consequence of Wrong |
|---------|------------|---------------|---------------------|
| {{setting}} | {{wrong}} | {{correct}} | {{consequence}} |
| {{setting}} | {{wrong}} | {{correct}} | {{consequence}} |

---

## AI Agent Execution Pitfalls

Issues specific to AI-driven code generation and execution.

| Pitfall | Description | Guardrail |
|---------|-------------|-----------|
| Over-engineering | Agent adds unnecessary abstractions | Scope boundary in phase prompt |
| Hallucinated APIs | Agent uses non-existent library methods | Verification commands catch failures |
| Silent failures | Agent skips failing tests | Gate requires all tests passing |
| Scope drift | Agent implements v2 features during v1 | Requirements doc marks clear boundaries |
| Lost context | Agent forgets decisions from prior phases | CONTEXT.md carry-forward section |

---

## Recovery Playbooks

### When build breaks mid-phase

1. {{recovery_step_1}}
2. {{recovery_step_2}}
3. {{recovery_step_3}}

### When tests fail after integration

1. {{recovery_step_1}}
2. {{recovery_step_2}}
3. {{recovery_step_3}}

---

## Pitfall Checklist

Pre-execution checklist to review before each phase:

- [ ] Reviewed stack-specific pitfalls for this phase
- [ ] Checked integration points between new and existing code
- [ ] Verified configuration values match environment
- [ ] Confirmed agent guardrails are in phase prompt
- [ ] Identified rollback strategy if phase fails
