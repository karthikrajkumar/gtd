/**
 * Phase 8: Forward Execution Engine Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, createTempPlanningDir, writePlanningFile, mockGitCommit } = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { createPhase, listPlans, groupIntoWaves, getPhaseProgress } = require('../lib/phase.cjs');
const { loadState, updateState, transition } = require('../lib/state.cjs');

// ================================================================
// Execution agents (4)
// ================================================================

const EXECUTION_AGENTS = [
  { name: 'gtd-executor', role: 'execution', parallel: true, tier: 'sonnet' },
  { name: 'gtd-verifier', role: 'verification', parallel: false, tier: 'sonnet' },
  { name: 'gtd-code-reviewer', role: 'review', parallel: false, tier: 'sonnet' },
  { name: 'gtd-debugger', role: 'debug', parallel: false, tier: 'sonnet' },
];

describe('Execution agent definitions', () => {
  for (const agent of EXECUTION_AGENTS) {
    describe(agent.name, () => {
      const agentPath = path.join(PROJECT_ROOT, 'agents/forward', `${agent.name}.md`);

      it('exists', () => {
        expect(fs.existsSync(agentPath), `Missing: ${agent.name}`).toBe(true);
      });

      it('has valid frontmatter', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.name).toBe(agent.name);
        expect(frontmatter.category).toBe('forward');
        expect(frontmatter.role).toBe(agent.role);
      });

      it(`uses ${agent.tier} model tier`, () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.model_tier).toBe(agent.tier);
      });
    });
  }

  it('executor has Write and Edit tools (can modify code)', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'agents/forward/gtd-executor.md'), 'utf8'
    );
    expect(content).toContain('- Write');
    expect(content).toContain('- Edit');
    expect(content).toContain('- Bash');
  });

  it('executor documents atomic commit requirement', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'agents/forward/gtd-executor.md'), 'utf8'
    );
    const hasCommitRef = content.toLowerCase().includes('atomic') ||
                         content.toLowerCase().includes('commit');
    expect(hasCommitRef).toBe(true);
  });

  it('verifier checks requirements traceability', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'agents/forward/gtd-verifier.md'), 'utf8'
    );
    expect(content).toContain('REQUIREMENTS');
    expect(content).toContain('VERIFICATION');
  });

  it('debugger has Write/Edit tools (can fix code)', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'agents/forward/gtd-debugger.md'), 'utf8'
    );
    expect(content).toContain('- Write');
    expect(content).toContain('- Edit');
  });

  it('has 10 total forward agents (6 planning + 4 execution)', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/forward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(10);
  });
});

// ================================================================
// Execution workflows
// ================================================================

describe('Execution workflows', () => {
  const workflows = [
    { file: 'execute-phase.md', mustContain: ['gtd-executor', 'wave', 'SUMMARY', 'integration_checkpoint'] },
    { file: 'verify-work.md', mustContain: ['gtd-verifier', 'REQUIREMENTS', 'VERIFICATION'] },
    { file: 'ship.md', mustContain: ['PR', 'push', 'branch'] },
  ];

  for (const wf of workflows) {
    describe(wf.file, () => {
      const wfPath = path.join(PROJECT_ROOT, 'workflows/forward', wf.file);

      it('exists', () => {
        expect(fs.existsSync(wfPath)).toBe(true);
      });

      for (const term of wf.mustContain) {
        it(`contains "${term}"`, () => {
          const content = fs.readFileSync(wfPath, 'utf8');
          expect(content).toContain(term);
        });
      }
    });
  }

  it('has 6 forward workflows total (new-project, discuss, plan, execute, verify, ship)', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/forward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(6);
  });
});

// ================================================================
// Forward commands
// ================================================================

describe('Forward commands — complete set', () => {
  const REQUIRED = [
    'new-project.md', 'discuss-phase.md', 'plan-phase.md',
    'execute-phase.md', 'verify-work.md', 'ship.md',
    'debug.md', 'code-review.md', 'next.md', 'autonomous.md',
    'quick.md', 'fast.md', 'new-milestone.md', 'complete-milestone.md',
    'add-phase.md', 'progress.md',
  ];

  const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/forward');

  for (const cmd of REQUIRED) {
    it(`has command: ${cmd}`, () => {
      expect(fs.existsSync(path.join(cmdDir, cmd)), `Missing: ${cmd}`).toBe(true);
    });
  }

  it('has 16 forward commands', () => {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(16);
  });

  it('all commands have gtd- name prefix', () => {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(cmdDir, file), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.name.startsWith('gtd-'), `${file}: name should start with gtd-`).toBe(true);
    }
  });
});

// ================================================================
// Execution context profile
// ================================================================

describe('Execution context profile', () => {
  it('exists', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'contexts/execution.md'))).toBe(true);
  });

  it('includes code output budget allocation', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'contexts/execution.md'), 'utf8');
    expect(content).toContain('code output');
    expect(content).toContain('PLAN');
  });

  it('documents git commit conventions', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'contexts/execution.md'), 'utf8');
    expect(content).toContain('commit');
    expect(content).toContain('gitignore');
  });
});

// ================================================================
// Execution state transitions
// ================================================================

describe('Execution state transitions', () => {
  it('planned → executing', () => {
    expect(transition('forward', 'planned', 'executing')).toBe(true);
  });

  it('executing → deployed', () => {
    expect(transition('forward', 'executing', 'deployed')).toBe(true);
  });

  it('executing → verified (skip deploy)', () => {
    expect(transition('forward', 'executing', 'verified')).toBe(true);
  });

  it('rejects: researched → executing (must plan first)', () => {
    expect(() => transition('forward', 'researched', 'executing')).toThrow();
  });
});

// ================================================================
// Simulated execution
// ================================================================

describe('Simulated execution pipeline', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('simulates: plans → execute → summaries → verify', () => {
    const commit = mockGitCommit();

    // Setup: create phase with plans
    const phase = createPhase(temp.dir, 1, 'Auth');
    fs.writeFileSync(path.join(phase, '01-01-schema-PLAN.md'), `---
plan_number: 1
dependencies: []
---
# Plan: DB Schema
## Tasks
1. Create User model
2. Create migration
## Verification
- npm run test:schema
`);
    fs.writeFileSync(path.join(phase, '01-02-routes-PLAN.md'), `---
plan_number: 2
dependencies: [schema]
---
# Plan: Auth Routes
## Tasks
1. POST /register
2. POST /login
## Verification
- npm run test:auth
`);

    // Verify plans discovered
    const plans = listPlans(phase);
    expect(plans).toHaveLength(2);

    // Verify wave grouping
    const waves = groupIntoWaves(plans, { 'routes': ['schema'] });
    expect(waves).toHaveLength(2);
    expect(waves[0]).toHaveLength(1); // schema alone
    expect(waves[1]).toHaveLength(1); // routes after schema

    // Simulate execution: executor writes SUMMARY files
    fs.writeFileSync(path.join(phase, '01-01-schema-SUMMARY.md'), `# Schema Plan Summary
## Results
- Task 1: ✓ User model created (src/models/user.js)
- Task 2: ✓ Migration created
## Commits
- abc1234: feat(phase-1): create User model
`);
    fs.writeFileSync(path.join(phase, '01-02-routes-SUMMARY.md'), `# Routes Plan Summary
## Results
- Task 1: ✓ POST /register endpoint
- Task 2: ✓ POST /login endpoint
## Commits
- def5678: feat(phase-1): add auth routes
`);

    // Verify progress
    const progress = getPhaseProgress(phase);
    expect(progress.total).toBe(2);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(100);

    // Simulate verification
    writePlanningFile(temp.dir, 'phases/01-auth/VERIFICATION.md', `# Phase 1 Verification
## Requirements
- REQ-AUTH-01: ✓ Implemented (User model + auth routes)
## Tests
- All passing (12/12)
## Regression
- No regression detected
`);

    // Update state
    updateState(temp.dir, { forward: { status: 'verified', current_phase: 1 } });
    const state = loadState(temp.dir);
    expect(state.forward.status).toBe('verified');
  });
});
