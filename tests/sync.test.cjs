/**
 * Phase 11: Sync Mode — Drift Detection and Reconciliation Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  PROJECT_ROOT,
  createTempPlanningDir,
  writePlanningFile,
  mockGitCommit,
} = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { loadState, updateState, transition } = require('../lib/state.cjs');
const {
  DRIFT_CATEGORIES,
  SEVERITY,
  RECONCILIATION_STRATEGIES,
  isDriftCheckNeeded,
  buildDriftContext,
  parseDriftReport,
  getReconciliationActions,
} = require('../lib/drift-engine.cjs');

// ================================================================
// lib/drift-engine.cjs
// ================================================================

describe('Drift Engine module', () => {
  describe('DRIFT_CATEGORIES', () => {
    it('has 4 categories', () => {
      expect(Object.keys(DRIFT_CATEGORIES)).toHaveLength(4);
      expect(DRIFT_CATEGORIES).toHaveProperty('ADDITION');
      expect(DRIFT_CATEGORIES).toHaveProperty('REMOVAL');
      expect(DRIFT_CATEGORIES).toHaveProperty('MUTATION');
      expect(DRIFT_CATEGORIES).toHaveProperty('STRUCTURAL');
    });
  });

  describe('SEVERITY', () => {
    it('has 4 levels', () => {
      expect(Object.keys(SEVERITY)).toHaveLength(4);
      expect(SEVERITY).toHaveProperty('CRITICAL');
      expect(SEVERITY).toHaveProperty('MAJOR');
      expect(SEVERITY).toHaveProperty('MINOR');
      expect(SEVERITY).toHaveProperty('INFO');
    });
  });

  describe('RECONCILIATION_STRATEGIES', () => {
    it('has 3 strategies', () => {
      expect(Object.keys(RECONCILIATION_STRATEGIES)).toHaveLength(3);
      expect(RECONCILIATION_STRATEGIES).toHaveProperty('code-wins');
      expect(RECONCILIATION_STRATEGIES).toHaveProperty('spec-wins');
      expect(RECONCILIATION_STRATEGIES).toHaveProperty('interactive');
    });
  });

  describe('isDriftCheckNeeded', () => {
    let temp;
    beforeEach(() => { temp = createTempPlanningDir(); });
    afterEach(() => { temp.cleanup(); });

    it('returns not needed when no state file', () => {
      const result = isDriftCheckNeeded(temp.dir);
      expect(result.needed).toBe(false);
    });

    it('returns needed when forward pipeline used but no drift check done', () => {
      updateState(temp.dir, { forward: { status: 'verified' } });
      const result = isDriftCheckNeeded(temp.dir);
      expect(result.needed).toBe(true);
      expect(result.reason).toContain('never been run');
    });
  });

  describe('buildDriftContext', () => {
    let temp;
    beforeEach(() => { temp = createTempPlanningDir(); });
    afterEach(() => { temp.cleanup(); });

    it('detects no specs or docs when empty', () => {
      const ctx = buildDriftContext(temp.dir);
      expect(ctx.hasSpecs).toBe(false);
      expect(ctx.hasDocs).toBe(false);
    });

    it('detects specs when REQUIREMENTS.md exists', () => {
      writePlanningFile(temp.dir, 'REQUIREMENTS.md', '# Requirements\n- REQ-01');
      const ctx = buildDriftContext(temp.dir);
      expect(ctx.hasSpecs).toBe(true);
      expect(ctx.specs.requirements).toBeTruthy();
    });

    it('detects docs when documents/ has files', () => {
      writePlanningFile(temp.dir, 'documents/TDD.md', '# TDD');
      writePlanningFile(temp.dir, 'documents/HLD.md', '# HLD');
      const ctx = buildDriftContext(temp.dir);
      expect(ctx.hasDocs).toBe(true);
      expect(ctx.docs).toHaveProperty('tdd');
      expect(ctx.docs).toHaveProperty('hld');
    });

    it('detects code when CODEBASE-MAP.md exists', () => {
      writePlanningFile(temp.dir, 'CODEBASE-MAP.md', '# Map');
      const ctx = buildDriftContext(temp.dir);
      expect(ctx.hasCode).toBe(true);
    });
  });

  describe('parseDriftReport', () => {
    let temp;
    beforeEach(() => { temp = createTempPlanningDir(); });
    afterEach(() => { temp.cleanup(); });

    it('returns exists:false when no report', () => {
      const report = parseDriftReport(temp.dir);
      expect(report.exists).toBe(false);
      expect(report.summary.total).toBe(0);
    });

    it('parses report with frontmatter', () => {
      writePlanningFile(temp.dir, 'DRIFT-REPORT.md', `---
total_items: 5
critical: 1
major: 2
minor: 1
info: 1
timestamp: 2026-04-10T15:00:00Z
---
# Drift Report
Found 5 drift items.
`);
      const report = parseDriftReport(temp.dir);
      expect(report.exists).toBe(true);
      expect(report.summary.total).toBe(5);
      expect(report.summary.critical).toBe(1);
      expect(report.summary.major).toBe(2);
    });
  });

  describe('getReconciliationActions', () => {
    it('returns actions for ADDITION', () => {
      const actions = getReconciliationActions('ADDITION');
      expect(actions.length).toBeGreaterThanOrEqual(2);
      expect(actions.some((a) => a.action === 'add-to-spec')).toBe(true);
    });

    it('returns actions for REMOVAL', () => {
      const actions = getReconciliationActions('REMOVAL');
      expect(actions.some((a) => a.action === 'implement')).toBe(true);
      expect(actions.some((a) => a.action === 'remove-from-spec')).toBe(true);
    });

    it('returns actions for MUTATION', () => {
      const actions = getReconciliationActions('MUTATION');
      expect(actions.some((a) => a.action === 'update-spec')).toBe(true);
      expect(actions.some((a) => a.action === 'update-code')).toBe(true);
    });

    it('returns actions for STRUCTURAL', () => {
      const actions = getReconciliationActions('STRUCTURAL');
      expect(actions.some((a) => a.action === 'update-all')).toBe(true);
    });

    it('returns ignore for unknown category', () => {
      const actions = getReconciliationActions('UNKNOWN');
      expect(actions[0].action).toBe('ignore');
    });
  });
});

// ================================================================
// Sync state transitions
// ================================================================

describe('Sync state transitions', () => {
  it('synced → drifted', () => {
    expect(transition('sync', 'synced', 'drifted')).toBe(true);
  });

  it('drifted → reconciling', () => {
    expect(transition('sync', 'drifted', 'reconciling')).toBe(true);
  });

  it('reconciling → synced', () => {
    expect(transition('sync', 'reconciling', 'synced')).toBe(true);
  });

  it('rejects: synced → reconciling (must drift first)', () => {
    expect(() => transition('sync', 'synced', 'reconciling')).toThrow();
  });

  it('rejects: drifted → synced (must reconcile first)', () => {
    expect(() => transition('sync', 'drifted', 'synced')).toThrow();
  });
});

// ================================================================
// Sync agents
// ================================================================

describe('Sync agent definitions', () => {
  const SYNC_AGENTS = [
    { name: 'gtd-drift-detector', role: 'sync' },
    { name: 'gtd-reconciliation-planner', role: 'sync' },
    { name: 'gtd-alignment-auditor', role: 'sync' },
  ];

  for (const agent of SYNC_AGENTS) {
    describe(agent.name, () => {
      const agentPath = path.join(PROJECT_ROOT, 'agents/sync', `${agent.name}.md`);

      it('exists', () => {
        expect(fs.existsSync(agentPath), `Missing: ${agent.name}`).toBe(true);
      });

      it('has valid frontmatter', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.name).toBe(agent.name);
        expect(frontmatter.category).toBe('sync');
        expect(frontmatter.role).toBe(agent.role);
      });
    });
  }

  it('has 3 sync agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/sync');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(3);
  });
});

// ================================================================
// Sync workflows
// ================================================================

describe('Sync workflows', () => {
  const REQUIRED = ['detect-drift.md', 'reconcile.md', 'sync.md', 'audit.md'];
  const dir = path.join(PROJECT_ROOT, 'workflows/sync');

  for (const wf of REQUIRED) {
    it(`has workflow: ${wf}`, () => {
      expect(fs.existsSync(path.join(dir, wf)), `Missing: ${wf}`).toBe(true);
    });
  }

  it('has 4 sync workflows', () => {
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(4);
  });

  it('detect-drift workflow references drift-detector agent', () => {
    const content = fs.readFileSync(path.join(dir, 'detect-drift.md'), 'utf8');
    expect(content).toContain('gtd-drift-detector');
  });

  it('reconcile workflow references reconciliation-planner agent', () => {
    const content = fs.readFileSync(path.join(dir, 'reconcile.md'), 'utf8');
    expect(content).toContain('gtd-reconciliation-planner');
  });

  it('audit workflow references alignment-auditor agent', () => {
    const content = fs.readFileSync(path.join(dir, 'audit.md'), 'utf8');
    expect(content).toContain('gtd-alignment-auditor');
  });
});

// ================================================================
// Sync commands
// ================================================================

describe('Sync commands', () => {
  const REQUIRED = ['drift.md', 'reconcile.md', 'sync.md', 'audit.md'];
  const dir = path.join(PROJECT_ROOT, 'commands/gtd/sync');

  for (const cmd of REQUIRED) {
    it(`has command: ${cmd}`, () => {
      expect(fs.existsSync(path.join(dir, cmd)), `Missing: ${cmd}`).toBe(true);
    });
  }

  it('has 4 sync commands', () => {
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(4);
  });

  it('all commands have gtd- name prefix', () => {
    for (const cmd of REQUIRED) {
      const content = fs.readFileSync(path.join(dir, cmd), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.name.startsWith('gtd-')).toBe(true);
    }
  });
});

// ================================================================
// CLI integration
// ================================================================

describe('CLI drift tools', () => {
  it('drift check works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" drift check`,
      { encoding: 'utf8' }
    ).trim();
    const info = JSON.parse(result);
    expect(info).toHaveProperty('needed');
    expect(info).toHaveProperty('reason');
  });

  it('drift context works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" drift context`,
      { encoding: 'utf8' }
    ).trim();
    const ctx = JSON.parse(result);
    expect(ctx).toHaveProperty('hasSpecs');
    expect(ctx).toHaveProperty('hasDocs');
    expect(ctx).toHaveProperty('hasCode');
  });

  it('drift actions works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" drift actions ADDITION`,
      { encoding: 'utf8' }
    ).trim();
    const actions = JSON.parse(result);
    expect(actions.length).toBeGreaterThanOrEqual(2);
  });
});

// ================================================================
// Simulated sync pipeline
// ================================================================

describe('Simulated sync pipeline', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('simulates: forward → drift detected → reconcile → synced', () => {
    // Step 1: Forward pipeline was used
    writePlanningFile(temp.dir, 'REQUIREMENTS.md', '# Requirements\n- REQ-AUTH-01: User auth\n- REQ-API-01: REST API');
    writePlanningFile(temp.dir, 'ROADMAP.md', '# Roadmap\n| 1 | Auth | REQ-AUTH-01 | complete |');
    updateState(temp.dir, { forward: { status: 'verified', current_phase: 1 } });

    // Step 2: Backward docs exist
    writePlanningFile(temp.dir, 'documents/TDD.md', '# TDD\n## Auth: JWT-based');
    writePlanningFile(temp.dir, 'CODEBASE-MAP.md', '# Map');
    updateState(temp.dir, { backward: { status: 'finalized' } });

    // Step 3: Drift detected
    writePlanningFile(temp.dir, 'DRIFT-REPORT.md', `---
total_items: 3
critical: 0
major: 1
minor: 1
info: 1
---
# Drift Report
## Items
| # | Category | Description | Severity |
|---|----------|-------------|----------|
| 1 | ADDITION | New /api/admin endpoint not in spec | MAJOR |
| 2 | MUTATION | Auth uses session instead of JWT | MINOR |
| 3 | ADDITION | Added rate limiting (improvement) | INFO |
`);
    updateState(temp.dir, { sync: { status: 'drifted', drift_items: 3 } });

    // Verify drift state
    const state1 = loadState(temp.dir);
    expect(state1.sync.status).toBe('drifted');
    expect(state1.sync.drift_items).toBe(3);

    // Step 4: Reconciliation plan
    writePlanningFile(temp.dir, 'RECONCILIATION-PLAN.md', `# Reconciliation Plan
## Strategy: code-wins
| # | Item | Action |
|---|------|--------|
| 1 | /api/admin | add-to-spec: Add REQ-ADMIN-01 |
| 2 | Session auth | update-spec: Change auth description |
| 3 | Rate limiting | ignore: Good improvement |
`);
    updateState(temp.dir, { sync: { status: 'reconciling' } });

    // Step 5: Apply → synced
    updateState(temp.dir, {
      sync: { status: 'synced', drift_items: 0, last_drift_check: new Date().toISOString() },
    });

    const finalState = loadState(temp.dir);
    expect(finalState.sync.status).toBe('synced');
    expect(finalState.sync.drift_items).toBe(0);
    expect(finalState.forward.status).toBe('verified');
    expect(finalState.backward.status).toBe('finalized');
  });
});

// ================================================================
// Grand total verification
// ================================================================

describe('Grand totals after Phase 11', () => {
  it('has 33 total agents (12 forward + 18 backward + 3 sync)', () => {
    const fwd = fs.readdirSync(path.join(PROJECT_ROOT, 'agents/forward')).filter((f) => f.endsWith('.md')).length;
    const bwd = fs.readdirSync(path.join(PROJECT_ROOT, 'agents/backward')).filter((f) => f.endsWith('.md')).length;
    const sync = fs.readdirSync(path.join(PROJECT_ROOT, 'agents/sync')).filter((f) => f.endsWith('.md')).length;
    expect(fwd + bwd + sync).toBe(33);
  });

  it('has 40 total commands (16 forward + 15 backward + 4 sync + 5 utility)', () => {
    const fwd = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/forward')).filter((f) => f.endsWith('.md')).length;
    const bwd = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/backward')).filter((f) => f.endsWith('.md')).length;
    const sync = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/sync')).filter((f) => f.endsWith('.md')).length;
    const util = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/utility')).filter((f) => f.endsWith('.md')).length;
    expect(fwd + bwd + sync + util).toBe(40);
  });

  it('has 28 total workflows (18 forward + 6 backward + 4 sync)', () => {
    const fwd = fs.readdirSync(path.join(PROJECT_ROOT, 'workflows/forward')).filter((f) => f.endsWith('.md')).length;
    const bwd = fs.readdirSync(path.join(PROJECT_ROOT, 'workflows/backward')).filter((f) => f.endsWith('.md')).length;
    const sync = fs.readdirSync(path.join(PROJECT_ROOT, 'workflows/sync')).filter((f) => f.endsWith('.md')).length;
    expect(fwd + bwd + sync).toBeGreaterThanOrEqual(28);
  });
});
