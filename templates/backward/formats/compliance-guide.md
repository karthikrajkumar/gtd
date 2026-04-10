# Compliance Format Guide

> How to use GTD's compliance document format for SOC 2, ISO 27001, and HIPAA audits.

## Usage

```
/gtd-create-tdd --format compliance
/gtd-create-all --format compliance
/gtd-audit --compliance soc2
```

## What Compliance Format Adds

| Standard Section | Compliance Addition |
|-----------------|-------------------|
| Data Model | Data Classification Matrix (PII, PHI, financial) |
| Auth Design | Authorization Matrix (RBAC/ABAC mapping) |
| Security | Encryption & Key Management section |
| Logging | Audit trail with tamper protection |
| Dependencies | Supply chain risk assessment |
| Testing | Security testing section (SAST, DAST, pen test) |
| New Section | SOC 2 controls mapping |
| New Section | ISO 27001 Annex A controls |
| New Section | Risk assessment with residual risk |
| New Section | Business continuity / disaster recovery |

## SOC 2 Trust Service Criteria Covered

- **Security (CC):** Network, access controls, encryption
- **Availability (A):** BCDR, monitoring, SLAs
- **Processing Integrity (PI):** Audit logging, data validation
- **Confidentiality (C):** Data classification, encryption at rest/transit
- **Privacy (P):** PII handling, retention policies

## ISO 27001 Annex A Controls Mapped

The compliance format automatically maps to relevant Annex A controls:
- A.8: Asset management (data classification)
- A.9: Access control (auth matrix)
- A.10: Cryptography (encryption section)
- A.12: Operations security (deployment, monitoring)
- A.14: System development (testing, dependencies)
- A.16: Incident management (audit logging)
- A.17: Business continuity (BCDR)
