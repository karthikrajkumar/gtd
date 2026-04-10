/**
 * Phase 10: Forward Pipeline Orchestration Tests — MVP Forward Milestone
 *
 * Verifies the complete forward pipeline is wired end-to-end:
 * all workflows, commands, agents, context profiles, and state flow.
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
const { loadRoadmap, getNextPhase, getRoadmapProgress } = require('../lib/roadmap.cjs');
const { createPhase, listPhases, listPlans, getPhaseProgress } = require('../lib/phase.cjs');
const { detectDeployMethod } = require('../lib/deploy.cjs');
const { getTestSummary } = require('../lib/test-runner.cjs');

// ================================================================
// 1. ALL FORWARD WORKFLOWS — COMPLETE SET
// ================================================================

describe('Forward workflows — complete set', () => {
  const REQUIRED = [
    'new-project.md', 'discuss-phase.md', 'plan-phase.md',
    'execute-phase.md', 'verify-work.md', 'deploy-local.md',
    'test-phase.md', 'ship.md',
    'next.md', 'autonomous.md', 'quick.md', 'fast.md',
    'debug.md', 'code-review.md',
    'new-milestone.md', 'complete-milestone.md',
    'add-phase.md', 'progress.md',
  ];

  const dir = path.join(PROJECT_ROOT, 'workflows/forward');

  for (const wf of REQUIRED) {
    it(`has workflow: ${wf}`, () => {
      expect(fs.existsSync(path.join(dir, wf)), `Missing: ${wf}`).toBe(true);
    });
  }

  it('has 18 forward workflows total', () => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(18);
  });
});

// ================================================================
// 2. ALL COMMANDS HAVE MATCHING WORKFLOWS
// ================================================================

describe('Command ↔ Workflow alignment', () => {
  it('every forward command references a workflow', () => {
    const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/forward');
    const wfDir = path.join(PROJECT_ROOT, 'workflows/forward');

    const commands = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    const workflows = fs.readdirSync(wfDir).filter((f) => f.endsWith('.md'));

    for (const cmd of commands) {
      const content = fs.readFileSync(path.join(cmdDir, cmd), 'utf8');
      // Each command should reference a workflow file
      const hasRef = content.includes('workflows/forward/') || content.includes('@workflows');
      expect(hasRef, `${cmd} should reference a workflow`).toBe(true);
    }
  });

  it('every backward command references a workflow', () => {
    const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/backward');
    const commands = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));

    for (const cmd of commands) {
      const content = fs.readFileSync(path.join(cmdDir, cmd), 'utf8');
      const hasRef = content.includes('workflows/') || content.includes('@workflows') || content.includes('gtd-tools.cjs');
      expect(hasRef, `${cmd} should reference a workflow or tool`).toBe(true);
    }
  });
});

// ================================================================
// 3. CONTEXT PROFILES — ALL AGENT CATEGORIES
// ================================================================

describe('Context profiles — complete set', () => {
  const REQUIRED = ['analysis.md', 'writing.md', 'review.md', 'execution.md', 'research.md', 'planning.md'];
  const dir = path.join(PROJECT_ROOT, 'contexts');

  for (const ctx of REQUIRED) {
    it(`has context profile: ${ctx}`, () => {
      expect(fs.existsSync(path.join(dir, ctx)), `Missing: ${ctx}`).toBe(true);
    });
  }

  it('has 6 context profiles', () => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(6);
  });

  it('all profiles define context budget allocation', () => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(content, `${file} missing budget allocation`).toContain('Budget');
    }
  });

  it('all profiles define tool permissions', () => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      expect(content, `${file} missing tool permissions`).toContain('Tool');
    }
  });
});

// ================================================================
// 4. FULL FORWARD STATE FLOW SIMULATION
// ================================================================

describe('Full forward state flow: empty → researched → planned → executing → deployed → tested → verified', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('simulates complete forward lifecycle', () => {
    // === STEP 1: New Project (empty → researched) ===
    writePlanningFile(temp.dir, 'PROJECT.md', '# Todo App\nA REST API for todos.');
    writePlanningFile(temp.dir, 'REQUIREMENTS.md', `# Requirements
## v1
- REQ-AUTH-01: User auth
- REQ-TODO-01: CRUD todos
- REQ-API-01: REST endpoints
`);
    writePlanningFile(temp.dir, 'ROADMAP.md', `---
project: todo-app
---
# Roadmap
| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| 1 | Auth | REQ-AUTH-01 | pending |
| 2 | API | REQ-TODO-01 REQ-API-01 | pending |
| 3 | Frontend | UI | pending |
`);
    writePlanningFile(temp.dir, 'research/SUMMARY.md', '# Research Summary\nUse Express + Prisma.');
    updateState(temp.dir, { forward: { status: 'researched', current_milestone: 'v1.0' } });
    expect(loadState(temp.dir).forward.status).toBe('researched');

    // === STEP 2: Discuss Phase (preferences captured) ===
    const phase1 = createPhase(temp.dir, 1, 'Auth');
    writePlanningFile(temp.dir, 'phases/01-auth/01-CONTEXT.md', '# Decisions\n- JWT with bcrypt');

    // === STEP 3: Plan Phase (researched → planned) ===
    fs.writeFileSync(path.join(phase1, '01-01-schema-PLAN.md'), '# Plan: Schema');
    fs.writeFileSync(path.join(phase1, '01-02-routes-PLAN.md'), '# Plan: Routes');
    updateState(temp.dir, { forward: { status: 'planned', current_phase: 1 } });
    expect(loadState(temp.dir).forward.status).toBe('planned');
    expect(listPlans(phase1)).toHaveLength(2);

    // === STEP 4: Execute Phase (planned → executing) ===
    fs.writeFileSync(path.join(phase1, '01-01-schema-SUMMARY.md'), '# Done: Schema');
    fs.writeFileSync(path.join(phase1, '01-02-routes-SUMMARY.md'), '# Done: Routes');
    updateState(temp.dir, { forward: { status: 'executing' } });
    expect(getPhaseProgress(phase1).percentage).toBe(100);

    // === STEP 5: Deploy (executing → deployed) ===
    writePlanningFile(temp.dir, 'DEPLOY-REPORT.md', '# Deploy\nStatus: running on port 3000');
    updateState(temp.dir, { forward: { status: 'deployed' } });
    expect(loadState(temp.dir).forward.status).toBe('deployed');

    // === STEP 6: Test (deployed → tested) ===
    writePlanningFile(temp.dir, 'TEST-REPORT.md', '# Tests\nPassed: 12/12');
    updateState(temp.dir, { forward: { status: 'tested' } });
    expect(loadState(temp.dir).forward.status).toBe('tested');

    // === STEP 7: Verify (tested → verified) ===
    writePlanningFile(temp.dir, 'phases/01-auth/VERIFICATION.md', '# Verified\nREQ-AUTH-01: PASS');
    updateState(temp.dir, { forward: { status: 'verified' } });
    expect(loadState(temp.dir).forward.status).toBe('verified');

    // === ROADMAP PROGRESS ===
    const progress = getRoadmapProgress(temp.dir);
    expect(progress.total_phases).toBe(3);

    // === NEXT PHASE ===
    const next = getNextPhase(temp.dir);
    expect(next).toBeTruthy();
    expect(next.number).toBe(1); // Still pending in roadmap (not updated yet)
  });
});

// ================================================================
// 5. BIDIRECTIONAL PROOF: Forward → Backward
// ================================================================

describe('Bidirectional: forward output feeds backward input', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('forward-generated code can be scanned by backward pipeline', () => {
    // Simulate: forward pipeline generated code, now backward scans it
    updateState(temp.dir, {
      forward: { status: 'verified', current_phase: 1, current_milestone: 'v1.0' },
    });

    // Backward pipeline starts: scan the code that forward just wrote
    writePlanningFile(temp.dir, 'CODEBASE-MAP.md', `---
commit: ${mockGitCommit()}
files_indexed: 20
---
# Codebase Map
## Project Identity
- **Name:** todo-api
- **Frameworks:** Express.js
`);
    updateState(temp.dir, {
      backward: { status: 'scanned', last_scan_commit: mockGitCommit() },
    });

    const state = loadState(temp.dir);
    // BOTH pipelines have state
    expect(state.forward.status).toBe('verified');
    expect(state.backward.status).toBe('scanned');
    expect(state.mode).toBe('bidirectional');
  });
});

// ================================================================
// 6. TOTAL COUNTS — MVP FORWARD
// ================================================================

describe('MVP Forward totals', () => {
  it('has 12 forward agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/forward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(12);
  });

  it('has 18 backward agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/backward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(18);
  });

  it('has 30 total agents (forward + backward)', () => {
    const fwd = fs.readdirSync(path.join(PROJECT_ROOT, 'agents/forward')).filter((f) => f.endsWith('.md')).length;
    const bwd = fs.readdirSync(path.join(PROJECT_ROOT, 'agents/backward')).filter((f) => f.endsWith('.md')).length;
    expect(fwd + bwd).toBe(30);
  });

  it('has 16 forward commands', () => {
    const dir = path.join(PROJECT_ROOT, 'commands/gtd/forward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(16);
  });

  it('has 15 backward commands', () => {
    const dir = path.join(PROJECT_ROOT, 'commands/gtd/backward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(15);
  });

  it('has 5 utility commands', () => {
    const dir = path.join(PROJECT_ROOT, 'commands/gtd/utility');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(5);
  });

  it('has 36 total commands', () => {
    const fwd = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/forward')).filter((f) => f.endsWith('.md')).length;
    const bwd = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/backward')).filter((f) => f.endsWith('.md')).length;
    const util = fs.readdirSync(path.join(PROJECT_ROOT, 'commands/gtd/utility')).filter((f) => f.endsWith('.md')).length;
    expect(fwd + bwd + util).toBe(36);
  });

  it('has 18 forward workflows', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/forward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(18);
  });

  it('has 6 backward workflows', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/backward');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(6);
  });

  it('has 11 reference documents', () => {
    const dir = path.join(PROJECT_ROOT, 'references');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(11);
  });

  it('has 6 context profiles', () => {
    const dir = path.join(PROJECT_ROOT, 'contexts');
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(6);
  });
});

// ================================================================
// 7. CLI TOOLS — FORWARD OPERATIONS
// ================================================================

describe('CLI tools support forward operations', () => {
  it('phase list works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" phase list`,
      { encoding: 'utf8' }
    ).trim();
    const phases = JSON.parse(result);
    expect(Array.isArray(phases)).toBe(true);
  });

  it('roadmap status works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" roadmap status`,
      { encoding: 'utf8' }
    ).trim();
    const status = JSON.parse(result);
    expect(status).toHaveProperty('total_phases');
  });

  it('deploy detect works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" deploy detect`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const info = JSON.parse(result);
    expect(info).toHaveProperty('method');
  });

  it('test detect works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" test detect`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const info = JSON.parse(result);
    expect(info).toHaveProperty('framework');
  });

  it('init new-project works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" init new-project`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const ctx = JSON.parse(result);
    expect(ctx.workflow).toBe('new-project');
  });

  it('init execute-phase works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" init execute-phase 1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const ctx = JSON.parse(result);
    expect(ctx.workflow).toBe('execute-phase');
    expect(ctx.args.phase_number).toBe(1);
  });
});
