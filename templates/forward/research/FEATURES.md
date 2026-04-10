# Feature Implementation Patterns: {{project_name}}

> Researcher: {{agent_id}}
> Completed: {{timestamp}}
> Focus: Proven patterns for required features

---

## Feature Pattern Map

| Requirement ID | Feature | Recommended Pattern | Complexity |
|---------------|---------|--------------------| -----------|
| {{req_id}} | {{feature_name}} | {{pattern_name}} | {{low_medium_high}} |
| {{req_id}} | {{feature_name}} | {{pattern_name}} | {{low_medium_high}} |
| {{req_id}} | {{feature_name}} | {{pattern_name}} | {{low_medium_high}} |

---

## Pattern Details

### Pattern: {{pattern_1_name}}

**Used for:** {{req_ids}}

**Description:** {{pattern_1_description}}

**Implementation approach:**
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

**Key files to create:**
- `{{file_path_1}}` - {{file_purpose_1}}
- `{{file_path_2}}` - {{file_purpose_2}}

**Known gotchas:**
- {{gotcha_1}}
- {{gotcha_2}}

---

### Pattern: {{pattern_2_name}}

**Used for:** {{req_ids}}

**Description:** {{pattern_2_description}}

**Implementation approach:**
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

**Key files to create:**
- `{{file_path_1}}` - {{file_purpose_1}}
- `{{file_path_2}}` - {{file_purpose_2}}

**Known gotchas:**
- {{gotcha_1}}

---

## Feature Interactions

Features that touch the same code paths or share state:

| Feature A | Feature B | Interaction Type | Risk |
|-----------|-----------|-----------------|------|
| {{feature_a}} | {{feature_b}} | {{shared_state_conflict_dependency}} | {{risk_level}} |
| {{feature_a}} | {{feature_b}} | {{shared_state_conflict_dependency}} | {{risk_level}} |

### Recommended Implementation Order

Based on dependency analysis, implement features in this order:

1. {{feature_order_1}} - Foundation, no dependencies
2. {{feature_order_2}} - Depends on {{dependency}}
3. {{feature_order_3}} - Depends on {{dependency}}

---

## Anti-Patterns to Avoid

| Feature Area | Anti-Pattern | Why It Fails | Use Instead |
|-------------|-------------|--------------|-------------|
| {{area}} | {{anti_pattern}} | {{failure_reason}} | {{correct_pattern}} |
| {{area}} | {{anti_pattern}} | {{failure_reason}} | {{correct_pattern}} |

---

## Reference Implementations

| Feature | Reference Repo/Doc | Relevance |
|---------|-------------------|-----------|
| {{feature}} | {{reference_url}} | {{relevance_note}} |
| {{feature}} | {{reference_url}} | {{relevance_note}} |
