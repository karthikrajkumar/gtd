/**
 * Phase 6: Backward Pipeline Orchestration Tests
 *
 * Verifies:
 * 1. All backward workflows exist and are well-formed
 * 2. All backward + utility commands exist with correct frontmatter
 * 3. Full pipeline state flow: empty → scanned → analyzed → drafting → review → finalized
 * 4. Context profiles exist for all agent categories
 * 5. End-to-end simulated pipeline produces correct artifacts
 * 6. CLI tools support all required operations
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  PROJECT_ROOT,
  fixturePath,
  createTempPlanningDir,
  writePlanningFile,
  readPlanningFile,
  mockGitCommit,
} = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { loadState, updateState, transition } = require('../lib/state.cjs');
const { loadConfig, initConfig } = require('../lib/config.cjs');
const { getAnalysisStatus, getCodebaseMapStatus } = require('../lib/analysis.cjs');
const { listDocuments, finalize, getDocumentPath } = require('../lib/docs.cjs');
const { listTemplates, resolveTemplate, validateTemplate } = require('../lib/template.cjs');
const { listAgents, AGENT_REGISTRY } = require('../lib/agent-skills.cjs');

// ================================================================
// 1. ALL BACKWARD WORKFLOWS
// ================================================================

describe('Backward workflows — complete set', () => {
  const REQUIRED_WORKFLOWS = [
    'scan-codebase.md',
    'analyze-codebase.md',
    'generate-document.md',
    'create-all.md',
    'verify-document.md',
    'review-document.md',
  ];

  const workflowDir = path.join(PROJECT_ROOT, 'workflows/backward');

  for (const wf of REQUIRED_WORKFLOWS) {
    it(`has workflow: ${wf}`, () => {
      expect(fs.existsSync(path.join(workflowDir, wf))).toBe(true);
    });
  }

  it('has exactly 6 backward workflows', () => {
    const files = fs.readdirSync(workflowDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(6);
  });

  it('all workflows reference gtd-tools.cjs init', () => {
    for (const wf of REQUIRED_WORKFLOWS) {
      const content = fs.readFileSync(path.join(workflowDir, wf), 'utf8');
      // Most workflows init via gtd-tools, except create-all which delegates
      if (wf !== 'create-all.md') {
        expect(content).toContain('gtd-tools.cjs');
      }
    }
  });
});

// ================================================================
// 2. ALL BACKWARD + UTILITY COMMANDS
// ================================================================

describe('Backward commands — complete set', () => {
  const REQUIRED_BACKWARD = [
    'scan.md', 'analyze.md',
    'create-tdd.md', 'create-hld.md', 'create-lld.md',
    'create-capacity.md', 'create-sysdesign.md',
    'create-api-docs.md', 'create-runbook.md',
    'create-all.md',
    'verify-docs.md', 'review-docs.md', 'doc-status.md',
    'update-docs.md', 'diff.md',
  ];

  const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/backward');

  for (const cmd of REQUIRED_BACKWARD) {
    it(`has backward command: ${cmd}`, () => {
      expect(fs.existsSync(path.join(cmdDir, cmd))).toBe(true);
    });
  }

  it('has 15 backward commands', () => {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(15);
  });

  it('all commands have name in frontmatter', () => {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(cmdDir, file), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.name, `${file} missing name`).toBeTruthy();
      expect(frontmatter.name.startsWith('gtd-'), `${file} name should start with gtd-`).toBe(true);
    }
  });
});

describe('Utility commands — complete set', () => {
  const REQUIRED_UTILITY = ['help.md', 'status.md', 'settings.md', 'health.md', 'map-codebase.md'];

  const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/utility');

  for (const cmd of REQUIRED_UTILITY) {
    it(`has utility command: ${cmd}`, () => {
      expect(fs.existsSync(path.join(cmdDir, cmd))).toBe(true);
    });
  }

  it('has 5 utility commands', () => {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(5);
  });
});

// ================================================================
// 3. FULL PIPELINE STATE FLOW
// ================================================================

describe('Backward pipeline state flow', () => {
  let temp;

  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('starts at empty', () => {
    const state = loadState(temp.dir);
    expect(state.backward.status).toBe('empty');
  });

  it('transitions: empty → scanned', () => {
    expect(transition('backward', 'empty', 'scanned')).toBe(true);
    updateState(temp.dir, { backward: { status: 'scanned', last_scan_commit: mockGitCommit() } });
    expect(loadState(temp.dir).backward.status).toBe('scanned');
  });

  it('transitions: scanned → analyzed', () => {
    expect(transition('backward', 'scanned', 'analyzed')).toBe(true);
    updateState(temp.dir, { backward: { status: 'analyzed' } });
    expect(loadState(temp.dir).backward.status).toBe('analyzed');
  });

  it('transitions: analyzed → drafting', () => {
    expect(transition('backward', 'analyzed', 'drafting')).toBe(true);
    updateState(temp.dir, { backward: { status: 'drafting' } });
    expect(loadState(temp.dir).backward.status).toBe('drafting');
  });

  it('transitions: drafting → review', () => {
    expect(transition('backward', 'drafting', 'review')).toBe(true);
    updateState(temp.dir, { backward: { status: 'review' } });
    expect(loadState(temp.dir).backward.status).toBe('review');
  });

  it('transitions: review → finalized', () => {
    expect(transition('backward', 'review', 'finalized')).toBe(true);
    updateState(temp.dir, { backward: { status: 'finalized' } });
    expect(loadState(temp.dir).backward.status).toBe('finalized');
  });

  it('transitions: review → drafting (revision)', () => {
    expect(transition('backward', 'review', 'drafting')).toBe(true);
  });

  it('transitions: finalized → stale (code changes)', () => {
    expect(transition('backward', 'finalized', 'stale')).toBe(true);
    updateState(temp.dir, { backward: { status: 'stale' } });
    expect(loadState(temp.dir).backward.status).toBe('stale');
  });

  it('rejects invalid: empty → drafting', () => {
    expect(() => transition('backward', 'empty', 'drafting')).toThrow();
  });

  it('rejects invalid: scanned → finalized', () => {
    expect(() => transition('backward', 'scanned', 'finalized')).toThrow();
  });
});

// ================================================================
// 4. CONTEXT PROFILES
// ================================================================

describe('Context profiles', () => {
  const contextDir = path.join(PROJECT_ROOT, 'contexts');

  it('has analysis context profile', () => {
    expect(fs.existsSync(path.join(contextDir, 'analysis.md'))).toBe(true);
    const content = fs.readFileSync(path.join(contextDir, 'analysis.md'), 'utf8');
    expect(content).toContain('CODEBASE-MAP');
    expect(content).toContain('Context Budget');
  });

  it('has writing context profile', () => {
    expect(fs.existsSync(path.join(contextDir, 'writing.md'))).toBe(true);
    const content = fs.readFileSync(path.join(contextDir, 'writing.md'), 'utf8');
    expect(content).toContain('analysis');
    expect(content).toContain('Template');
  });

  it('has review context profile', () => {
    expect(fs.existsSync(path.join(contextDir, 'review.md'))).toBe(true);
    const content = fs.readFileSync(path.join(contextDir, 'review.md'), 'utf8');
    expect(content).toContain('verification');
  });
});

// ================================================================
// 5. END-TO-END SIMULATED PIPELINE
// ================================================================

describe('End-to-end simulated backward pipeline', () => {
  let temp;

  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('simulates full pipeline: scan → analyze → write → verify → finalize', () => {
    const commit = mockGitCommit();

    // === STEP 1: SCAN ===
    writePlanningFile(temp.dir, 'CODEBASE-MAP.md', `---
commit: ${commit}
timestamp: 2026-04-10T10:00:00Z
files_indexed: 20
---
# Codebase Map
## Project Identity
- **Name:** todo-api
- **Frameworks:** Express.js
`);
    writePlanningFile(temp.dir, 'analysis/FILE-INDEX.json', JSON.stringify({
      version: '1.0', commit, stats: { total_files: 20 }
    }));
    updateState(temp.dir, { backward: { status: 'scanned', last_scan_commit: commit } });
    expect(loadState(temp.dir).backward.status).toBe('scanned');
    expect(getCodebaseMapStatus(temp.dir).exists).toBe(true);

    // === STEP 2: ANALYZE ===
    for (const dim of ['architecture', 'api', 'data-flow', 'dependencies', 'security', 'performance']) {
      const filename = dim.toUpperCase().replace(/-/g, '-') + '-ANALYSIS.md';
      writePlanningFile(temp.dir, `analysis/${filename}`, `---
dimension: ${dim}
commit: ${commit}
timestamp: 2026-04-10T10:05:00Z
files_analyzed: 15
---
# ${dim} Analysis
Content for ${dim}.
`);
    }
    updateState(temp.dir, { backward: { status: 'analyzed', last_analysis_commit: commit } });
    expect(loadState(temp.dir).backward.status).toBe('analyzed');

    // === STEP 3: WRITE (TDD) ===
    writePlanningFile(temp.dir, 'drafts/TDD-DRAFT.md', `---
version: 1.0
commit: ${commit}
---
# Technical Design Document: Todo API
**Version:** 1.0
**Commit:** ${commit}
## 1. Executive Summary
The Todo API is a REST API built with Express.js.
## 2. Architecture
MVC pattern with routes, models, middleware.
`);
    updateState(temp.dir, { backward: { status: 'drafting' } });
    expect(loadState(temp.dir).backward.status).toBe('drafting');

    const docs = listDocuments(temp.dir);
    expect(docs.find(d => d.type === 'tdd').status).toBe('drafting');

    // === STEP 4: VERIFY ===
    writePlanningFile(temp.dir, 'verification/TDD-VERIFICATION.md', `---
document: tdd
total_claims: 10
verified: 9
inaccurate: 1
confidence_score: 90
---
# Verification Report: TDD
## Summary
- Verified: 9
- Inaccurate: 1
- Confidence: 90%
`);
    updateState(temp.dir, { backward: { status: 'review' } });

    // === STEP 5: FINALIZE ===
    finalize(temp.dir, 'tdd');
    const finalDocs = listDocuments(temp.dir);
    const tdd = finalDocs.find(d => d.type === 'tdd');
    expect(tdd.status).toBe('finalized');
    expect(fs.existsSync(getDocumentPath(temp.dir, 'tdd', false))).toBe(true);
    expect(fs.existsSync(getDocumentPath(temp.dir, 'tdd', true))).toBe(false); // Draft removed

    // === VERIFY FINAL STATE ===
    const finalState = loadState(temp.dir);
    expect(finalState.backward.documents.tdd.status).toBe('finalized');
  });
});

// ================================================================
// 6. CLI TOOLS VERIFICATION
// ================================================================

describe('CLI tools support all required operations', () => {
  it('gtd-tools.cjs version works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" version`,
      { encoding: 'utf8' }
    ).trim();
    expect(result).toBe('0.0.1');
  });

  it('gtd-tools.cjs config-get works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" config-get scan.max_files`,
      { encoding: 'utf8' }
    ).trim();
    expect(result).toBe('10000');
  });

  it('gtd-tools.cjs state get works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" state get`,
      { encoding: 'utf8' }
    ).trim();
    const state = JSON.parse(result);
    expect(state.mode).toBe('bidirectional');
  });

  it('gtd-tools.cjs analysis status works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" analysis status`,
      { encoding: 'utf8' }
    ).trim();
    const status = JSON.parse(result);
    expect(status).toHaveProperty('dimensions');
  });

  it('gtd-tools.cjs agent-skills works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" agent-skills gtd-tdd-writer`,
      { encoding: 'utf8' }
    ).trim();
    const info = JSON.parse(result);
    expect(info.name).toBe('gtd-tdd-writer');
    expect(info.category).toBe('backward');
  });

  it('gtd-tools.cjs doc list works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" doc list`,
      { encoding: 'utf8' }
    ).trim();
    const docs = JSON.parse(result);
    expect(docs).toHaveLength(7);
  });

  it('gtd-tools.cjs template list works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" template list`,
      { encoding: 'utf8' }
    ).trim();
    const templates = JSON.parse(result);
    expect(templates.length).toBeGreaterThanOrEqual(7);
  });

  it('gtd-tools.cjs init scan-codebase works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" init scan-codebase`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const ctx = JSON.parse(result);
    expect(ctx.workflow).toBe('scan-codebase');
    expect(ctx.project_root).toBeTruthy();
  });
});

// ================================================================
// 7. TOTAL COUNTS VERIFICATION
// ================================================================

describe('Phase 6 MVP totals', () => {
  it('has 18 backward agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/backward');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(18);
  });

  it('has 33 total agents in registry', () => {
    expect(Object.keys(AGENT_REGISTRY)).toHaveLength(33);
  });

  it('has 15 backward commands', () => {
    const dir = path.join(PROJECT_ROOT, 'commands/gtd/backward');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(15);
  });

  it('has 5 utility commands', () => {
    const dir = path.join(PROJECT_ROOT, 'commands/gtd/utility');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(5);
  });

  it('has 20 total commands (backward + utility)', () => {
    const back = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/backward')).filter(f => f.endsWith('.md')).length;
    const util = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/utility')).filter(f => f.endsWith('.md')).length;
    expect(back + util).toBe(20);
  });

  it('has 6 backward workflows', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/backward');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(6);
  });

  it('has 6 reference documents', () => {
    const dir = path.join(PROJECT_ROOT, 'references');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(6);
  });

  it('has 3 context profiles', () => {
    const dir = path.join(PROJECT_ROOT, 'contexts');
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.md'))).toHaveLength(3);
  });

  it('has 8 document templates', () => {
    const templates = listTemplates().filter(t => t.category === 'backward');
    const totalFormats = templates.reduce((sum, t) => sum + t.formats.length, 0);
    expect(totalFormats).toBe(8); // 7 standard + 1 enterprise
  });

  it('all templates validate successfully', () => {
    const templates = listTemplates();
    for (const tmpl of templates) {
      for (const format of tmpl.formats) {
        const resolved = resolveTemplate(tmpl.type, format);
        const content = fs.readFileSync(resolved, 'utf8');
        const result = validateTemplate(content);
        expect(result.valid, `${tmpl.type}/${format}: ${result.errors.join(', ')}`).toBe(true);
      }
    }
  });
});
