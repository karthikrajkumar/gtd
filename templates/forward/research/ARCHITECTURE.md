# Architecture Patterns: {{project_name}}

> Researcher: {{agent_id}}
> Completed: {{timestamp}}
> Focus: Structural patterns, trade-offs, and scalability

---

## Recommended Architecture

**Pattern:** {{architecture_pattern}}
**Style:** {{monolith_modular_microservices}}

### Architecture Diagram (Text)

```
{{architecture_diagram}}
```

### Layer Responsibilities

| Layer | Responsibility | Key Modules |
|-------|---------------|-------------|
| {{layer_name}} | {{responsibility}} | {{modules}} |
| {{layer_name}} | {{responsibility}} | {{modules}} |
| {{layer_name}} | {{responsibility}} | {{modules}} |
| {{layer_name}} | {{responsibility}} | {{modules}} |

---

## Directory Structure

```
{{project_root}}/
  src/
    {{dir_1}}/          # {{dir_1_purpose}}
    {{dir_2}}/          # {{dir_2_purpose}}
    {{dir_3}}/          # {{dir_3_purpose}}
    {{dir_4}}/          # {{dir_4_purpose}}
  tests/
    {{test_dir_1}}/     # {{test_dir_1_purpose}}
    {{test_dir_2}}/     # {{test_dir_2_purpose}}
  config/               # Environment and app configuration
```

---

## Architecture Alternatives

### Option A: {{alt_architecture_a}}

| Aspect | Assessment |
|--------|-----------|
| Complexity | {{low_medium_high}} |
| Scalability | {{assessment}} |
| Team fit | {{assessment}} |
| Time to MVP | {{assessment}} |

**Trade-offs:** {{trade_offs_a}}

### Option B: {{alt_architecture_b}}

| Aspect | Assessment |
|--------|-----------|
| Complexity | {{low_medium_high}} |
| Scalability | {{assessment}} |
| Team fit | {{assessment}} |
| Time to MVP | {{assessment}} |

**Trade-offs:** {{trade_offs_b}}

### Selection Rationale

{{architecture_selection_rationale}}

---

## Data Flow

### Primary Data Path

```
{{data_flow_diagram}}
```

### State Management

| State Type | Location | Sync Strategy |
|-----------|----------|---------------|
| {{state_type}} | {{location}} | {{strategy}} |
| {{state_type}} | {{location}} | {{strategy}} |

---

## Scaling Considerations

| Bottleneck | Threshold | Mitigation |
|-----------|-----------|------------|
| {{bottleneck}} | {{threshold}} | {{mitigation}} |
| {{bottleneck}} | {{threshold}} | {{mitigation}} |

---

## Security Architecture

| Concern | Approach | Layer |
|---------|----------|-------|
| {{security_concern}} | {{approach}} | {{layer}} |
| {{security_concern}} | {{approach}} | {{layer}} |

---

## Architecture Decision Records

| ADR | Decision | Status | Consequences |
|-----|----------|--------|-------------|
| ADR-001 | {{decision}} | {{accepted_proposed_deprecated}} | {{consequences}} |
| ADR-002 | {{decision}} | {{accepted_proposed_deprecated}} | {{consequences}} |
