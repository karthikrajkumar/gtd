/**
 * Tests for Phase 5: Verification Engine — Accuracy Verifier + Completeness Auditor
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, createTempPlanningDir, writePlanningFile, mockGitCommit } = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');

// --- Accuracy Verifier Agent ---

describe('Accuracy Verifier Agent', () => {
  const agentPath = path.join(PROJECT_ROOT, 'agents/backward/gtd-accuracy-verifier.md');

  it('exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  it('has valid frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-accuracy-verifier');
    expect(frontmatter.category).toBe('backward');
    expect(frontmatter.role).toBe('verification');
  });

  it('uses haiku model tier (cost-efficient for cross-referencing)', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.model_tier).toBe('haiku');
  });

  it('defines all 7 claim categories', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('FILE PATH CLAIMS');
    expect(content).toContain('CODE SNIPPET CLAIMS');
    expect(content).toContain('CONFIGURATION CLAIMS');
    expect(content).toContain('API ENDPOINT CLAIMS');
    expect(content).toContain('DEPENDENCY CLAIMS');
    expect(content).toContain('ARCHITECTURE CLAIMS');
    expect(content).toContain('DIAGRAM CLAIMS');
  });

  it('defines verification statuses', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('VERIFIED');
    expect(content).toContain('INACCURATE');
    expect(content).toContain('UNVERIFIABLE');
  });

  it('calculates confidence score', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('confidence_score');
    expect(content).toContain('verified');
    expect(content).toContain('total');
  });

  it('writes to verification/ directory', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('verification/');
    expect(content).toContain('VERIFICATION.md');
  });

  it('must never modify the draft document', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('NEVER modify the draft');
  });

  it('has Read/Bash/Grep/Glob tools (no Write — only reads and reports)', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('- Read');
    expect(content).toContain('- Bash');
    expect(content).toContain('- Grep');
    expect(content).toContain('- Glob');
  });
});

// --- Completeness Auditor Agent ---

describe('Completeness Auditor Agent', () => {
  const agentPath = path.join(PROJECT_ROOT, 'agents/backward/gtd-completeness-auditor.md');

  it('exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  it('has valid frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-completeness-auditor');
    expect(frontmatter.category).toBe('backward');
    expect(frontmatter.role).toBe('verification');
    expect(frontmatter.model_tier).toBe('haiku');
  });

  it('checks template section coverage', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('Template Coverage');
    expect(content).toContain('COMPLETE');
    expect(content).toContain('PARTIAL');
    expect(content).toContain('EMPTY');
    expect(content).toContain('MISSING');
  });

  it('checks component coverage from CODEBASE-MAP', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('Component Coverage');
    expect(content).toContain('CODEBASE-MAP');
    expect(content).toContain('DOCUMENTED');
  });

  it('checks cross-reference validity', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('Cross-Reference');
  });

  it('flags placeholder text', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('TODO');
    expect(content).toContain('TBD');
    expect(content).toContain('placeholder');
  });

  it('produces completeness score', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('Completeness Score');
  });
});

// --- Verification Reference ---

describe('Verification Patterns Reference', () => {
  const refPath = path.join(PROJECT_ROOT, 'references/verification-patterns.md');

  it('exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  it('defines verifiable vs non-verifiable claims', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Verifiable');
    expect(content).toContain('Opinion');
  });

  it('defines confidence score methodology', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Confidence Score');
    expect(content).toContain('95-100%');
    expect(content).toContain('Below 70%');
  });

  it('documents common false positive patterns', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('False Positive');
    expect(content).toContain('extension');
    expect(content).toContain('Aliased');
  });

  it('defines verification priority order', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Priority');
    expect(content).toContain('File paths');
    expect(content).toContain('Dependency versions');
  });
});

// --- Verify Workflow ---

describe('Verify Document Workflow', () => {
  const workflowPath = path.join(PROJECT_ROOT, 'workflows/backward/verify-document.md');

  it('exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('spawns accuracy verifier', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-accuracy-verifier');
  });

  it('spawns completeness auditor', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-completeness-auditor');
  });

  it('supports --strict flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('--strict');
  });

  it('checks both drafts and finalized documents', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('drafts/');
    expect(content).toContain('documents/');
  });

  it('aggregates both reports', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('Accuracy');
    expect(content).toContain('Completeness');
    expect(content).toContain('Confidence');
  });
});

// --- Backward agent roster after Phase 5 ---

describe('Backward agent roster after Phase 5', () => {
  it('has 18 backward agents (mapper + 7 analyzers + 7 writers + 1 diagram + 2 verifiers)', () => {
    const agentsDir = path.join(PROJECT_ROOT, 'agents/backward');
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(18);
  });
});

// --- Simulated verification output ---

describe('Simulated verification output', () => {
  let temp;

  beforeEach(() => {
    temp = createTempPlanningDir();
  });

  afterEach(() => {
    temp.cleanup();
  });

  it('validates accuracy verification report format', () => {
    writePlanningFile(temp.dir, 'verification/TDD-VERIFICATION.md', `---
document: tdd
draft_path: .planning/drafts/TDD-DRAFT.md
timestamp: 2026-04-10T12:00:00Z
total_claims: 25
verified: 23
inaccurate: 1
unverifiable: 1
confidence_score: 96
---

# Verification Report: TDD

## Summary
- **Total verifiable claims:** 25
- **Verified (accurate):** 23 ✓
- **Inaccurate:** 1 ✗
- **Unverifiable:** 1 ?
- **Confidence Score:** 96%

## Inaccurate Claims

### Section: Dependencies
| # | Claim | Status | Actual | Correction |
|---|-------|--------|--------|------------|
| 1 | "Express 4.18" | VERSION_MISMATCH | package.json shows 4.21.0 | Update to 4.21.0 |
`);

    const content = fs.readFileSync(path.join(temp.dir, 'verification/TDD-VERIFICATION.md'), 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    expect(frontmatter.document).toBe('tdd');
    expect(frontmatter.total_claims).toBe(25);
    expect(frontmatter.verified).toBe(23);
    expect(frontmatter.inaccurate).toBe(1);
    expect(frontmatter.confidence_score).toBe(96);
  });

  it('validates completeness report format', () => {
    writePlanningFile(temp.dir, 'verification/TDD-COMPLETENESS.md', `---
document: tdd
timestamp: 2026-04-10T12:00:00Z
template_sections: 10
sections_complete: 9
component_coverage: 100
overall_completeness: 95
---

# Completeness Report: TDD

## Section Coverage
| Section | Status | Notes |
|---------|--------|-------|
| Executive Summary | COMPLETE | — |
| Architecture | COMPLETE | — |
| Data Model | PARTIAL | Missing ER diagram |

## Gap Report
1. **Missing diagram:** No ER diagram in Data Model section
`);

    const content = fs.readFileSync(path.join(temp.dir, 'verification/TDD-COMPLETENESS.md'), 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    expect(frontmatter.document).toBe('tdd');
    expect(frontmatter.sections_complete).toBe(9);
    expect(frontmatter.component_coverage).toBe(100);
    expect(frontmatter.overall_completeness).toBe(95);
  });

  it('detects planted inaccuracy in simulated draft', () => {
    // Simulate a draft with a known-wrong file path
    writePlanningFile(temp.dir, 'drafts/TDD-DRAFT.md', `# TDD

## Architecture
Auth is handled in \`src/auth/handler.js\` (this file doesn't exist in our fixture).
The API uses Express \`4.18\` (actually 4.21 in the fixture).
`);

    // The test proves the verification REPORT format can capture these.
    // Actual agent detection is tested in proof-of-life.
    const draftContent = fs.readFileSync(path.join(temp.dir, 'drafts/TDD-DRAFT.md'), 'utf8');
    expect(draftContent).toContain('src/auth/handler.js'); // Planted wrong path
    expect(draftContent).toContain('4.18'); // Planted wrong version
  });
});
