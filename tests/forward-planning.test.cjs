/**
 * Phase 7: Forward Pipeline — Research and Planning Tests
 *
 * Verifies: lib modules, agents, templates, references, workflows, commands
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  PROJECT_ROOT,
  createTempPlanningDir,
  writePlanningFile,
  mockGitCommit,
} = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { phaseDir, listPhases, createPhase, listPlans, groupIntoWaves, getPhaseProgress } = require('../lib/phase.cjs');
const { loadRoadmap, parsePhases, extractRequirementIds, getRoadmapProgress, getNextPhase } = require('../lib/roadmap.cjs');
const { loadState, updateState, transition } = require('../lib/state.cjs');

// ================================================================
// lib/phase.cjs
// ================================================================

describe('Phase module', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  describe('phaseDir', () => {
    it('creates zero-padded slug', () => {
      expect(phaseDir(1, 'Authentication')).toBe('01-authentication');
      expect(phaseDir(10, 'Final Deploy')).toBe('10-final-deploy');
      expect(phaseDir(3, 'API & Routes')).toBe('03-api-routes');
    });
  });

  describe('listPhases', () => {
    it('returns empty for no phases dir', () => {
      expect(listPhases(temp.dir)).toEqual([]);
    });

    it('lists phases in order', () => {
      createPhase(temp.dir, 1, 'Auth');
      createPhase(temp.dir, 2, 'API');
      createPhase(temp.dir, 3, 'Frontend');
      const phases = listPhases(temp.dir);
      expect(phases).toHaveLength(3);
      expect(phases[0].number).toBe(1);
      expect(phases[1].number).toBe(2);
      expect(phases[2].number).toBe(3);
    });
  });

  describe('createPhase', () => {
    it('creates phase directory', () => {
      const p = createPhase(temp.dir, 1, 'Auth System');
      expect(fs.existsSync(p)).toBe(true);
      expect(p).toContain('01-auth-system');
    });
  });

  describe('listPlans', () => {
    it('returns empty for no plans', () => {
      const p = createPhase(temp.dir, 1, 'Auth');
      expect(listPlans(p)).toEqual([]);
    });

    it('lists plan files sorted by number', () => {
      const p = createPhase(temp.dir, 1, 'Auth');
      fs.writeFileSync(path.join(p, '01-02-api-endpoints-PLAN.md'), '# Plan 2');
      fs.writeFileSync(path.join(p, '01-01-db-schema-PLAN.md'), '# Plan 1');
      const plans = listPlans(p);
      expect(plans).toHaveLength(2);
      expect(plans[0].number).toBe(1);
      expect(plans[1].number).toBe(2);
    });
  });

  describe('groupIntoWaves', () => {
    it('puts independent plans in wave 1', () => {
      const plans = [
        { name: 'a', number: 1 },
        { name: 'b', number: 2 },
        { name: 'c', number: 3 },
      ];
      const waves = groupIntoWaves(plans, {});
      expect(waves).toHaveLength(1);
      expect(waves[0]).toHaveLength(3);
    });

    it('respects dependencies', () => {
      const plans = [
        { name: 'schema', number: 1 },
        { name: 'api', number: 2 },
        { name: 'tests', number: 3 },
      ];
      const deps = { api: ['schema'], tests: ['api'] };
      const waves = groupIntoWaves(plans, deps);
      expect(waves).toHaveLength(3);
      expect(waves[0][0].name).toBe('schema');
      expect(waves[1][0].name).toBe('api');
      expect(waves[2][0].name).toBe('tests');
    });

    it('handles empty plans', () => {
      expect(groupIntoWaves([])).toEqual([]);
    });
  });

  describe('getPhaseProgress', () => {
    it('returns zero for empty phase', () => {
      const p = createPhase(temp.dir, 1, 'Auth');
      const progress = getPhaseProgress(p);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });
});

// ================================================================
// lib/roadmap.cjs
// ================================================================

describe('Roadmap module', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  describe('loadRoadmap', () => {
    it('returns exists:false when no ROADMAP.md', () => {
      const rm = loadRoadmap(temp.dir);
      expect(rm.exists).toBe(false);
      expect(rm.phases).toEqual([]);
    });

    it('parses table-format roadmap', () => {
      writePlanningFile(temp.dir, 'ROADMAP.md', `---
project: test
---
# Roadmap

| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| 1 | Auth | User authentication REQ-AUTH-01 | pending |
| 2 | API | REST endpoints REQ-API-01 REQ-API-02 | pending |
| 3 | Frontend | UI components | pending |
`);
      const rm = loadRoadmap(temp.dir);
      expect(rm.exists).toBe(true);
      expect(rm.phases).toHaveLength(3);
      expect(rm.phases[0].number).toBe(1);
      expect(rm.phases[0].name).toBe('Auth');
      expect(rm.phases[1].requirements).toContain('REQ-API-01');
    });

    it('parses heading-format roadmap', () => {
      writePlanningFile(temp.dir, 'ROADMAP.md', `# Roadmap
## Phase 1: Authentication
Setup user auth system.
## Phase 2: REST API
Build API endpoints.
`);
      const rm = loadRoadmap(temp.dir);
      expect(rm.phases).toHaveLength(2);
      expect(rm.phases[0].name).toBe('Authentication');
    });
  });

  describe('extractRequirementIds', () => {
    it('extracts REQ-XXX patterns', () => {
      const ids = extractRequirementIds('This covers REQ-AUTH-01 and REQ-API-02');
      expect(ids).toContain('REQ-AUTH-01');
      expect(ids).toContain('REQ-API-02');
    });

    it('returns empty for no requirements', () => {
      expect(extractRequirementIds('No requirements here')).toEqual([]);
    });
  });

  describe('getRoadmapProgress', () => {
    it('tracks progress correctly', () => {
      writePlanningFile(temp.dir, 'ROADMAP.md', `# Roadmap
| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| 1 | Auth | Auth system | complete |
| 2 | API | REST API | in-progress |
| 3 | Frontend | UI | pending |
`);
      const progress = getRoadmapProgress(temp.dir);
      expect(progress.total_phases).toBe(3);
      expect(progress.completed).toBe(1);
      expect(progress.in_progress).toBe(1);
      expect(progress.pending).toBe(1);
    });
  });

  describe('getNextPhase', () => {
    it('returns first non-complete phase', () => {
      writePlanningFile(temp.dir, 'ROADMAP.md', `# Roadmap
| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| 1 | Auth | Done | complete |
| 2 | API | Next | pending |
| 3 | Frontend | Later | pending |
`);
      const next = getNextPhase(temp.dir);
      expect(next.number).toBe(2);
      expect(next.name).toBe('API');
    });
  });
});

// ================================================================
// Forward state transitions
// ================================================================

describe('Forward pipeline state transitions', () => {
  it('validates: empty → researched', () => {
    expect(transition('forward', 'empty', 'researched')).toBe(true);
  });
  it('validates: researched → planned', () => {
    expect(transition('forward', 'researched', 'planned')).toBe(true);
  });
  it('validates: planned → executing', () => {
    expect(transition('forward', 'planned', 'executing')).toBe(true);
  });
  it('rejects: empty → planned (must research first)', () => {
    expect(() => transition('forward', 'empty', 'planned')).toThrow();
  });
});

// ================================================================
// Forward agents
// ================================================================

describe('Forward agent definitions', () => {
  const FORWARD_AGENTS = [
    { name: 'gtd-project-researcher', role: 'research', parallel: true },
    { name: 'gtd-phase-researcher', role: 'research', parallel: true },
    { name: 'gtd-research-synthesizer', role: 'research', parallel: false },
    { name: 'gtd-roadmapper', role: 'planning', parallel: false },
    { name: 'gtd-planner', role: 'planning', parallel: false },
    { name: 'gtd-plan-checker', role: 'verification', parallel: false },
  ];

  for (const agent of FORWARD_AGENTS) {
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
    });
  }

  it('has 6 forward agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/forward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(6);
  });
});

// ================================================================
// Forward templates
// ================================================================

describe('Forward templates', () => {
  const REQUIRED_TEMPLATES = [
    'templates/forward/project.md',
    'templates/forward/requirements.md',
    'templates/forward/roadmap.md',
    'templates/forward/context.md',
    'templates/forward/phase-prompt.md',
    'templates/forward/research/SUMMARY.md',
    'templates/forward/research/STACK.md',
    'templates/forward/research/FEATURES.md',
    'templates/forward/research/ARCHITECTURE.md',
    'templates/forward/research/PITFALLS.md',
  ];

  for (const tmpl of REQUIRED_TEMPLATES) {
    it(`has template: ${tmpl}`, () => {
      expect(fs.existsSync(path.join(PROJECT_ROOT, tmpl)), `Missing: ${tmpl}`).toBe(true);
    });
  }
});

// ================================================================
// Forward references
// ================================================================

describe('Forward references', () => {
  const REQUIRED_REFS = [
    { file: 'references/questioning.md', mustContain: ['dream', 'question'] },
    { file: 'references/planning-config.md', mustContain: ['granularity', 'coarse'] },
    { file: 'references/agent-contracts.md', mustContain: ['orchestrat', 'spawn'] },
    { file: 'references/context-budget.md', mustContain: ['200K', 'token'] },
    { file: 'references/gate-prompts.md', mustContain: ['gate', 'Revision'] },
  ];

  for (const ref of REQUIRED_REFS) {
    describe(path.basename(ref.file), () => {
      it('exists', () => {
        expect(fs.existsSync(path.join(PROJECT_ROOT, ref.file)), `Missing: ${ref.file}`).toBe(true);
      });

      for (const term of ref.mustContain) {
        it(`contains "${term}"`, () => {
          const content = fs.readFileSync(path.join(PROJECT_ROOT, ref.file), 'utf8');
          expect(content.toLowerCase()).toContain(term.toLowerCase());
        });
      }
    });
  }
});

// ================================================================
// Forward workflows
// ================================================================

describe('Forward workflows', () => {
  const REQUIRED = ['new-project.md', 'discuss-phase.md', 'plan-phase.md'];
  const dir = path.join(PROJECT_ROOT, 'workflows/forward');

  for (const wf of REQUIRED) {
    it(`has workflow: ${wf}`, () => {
      expect(fs.existsSync(path.join(dir, wf))).toBe(true);
    });
  }
});

// ================================================================
// Forward commands
// ================================================================

describe('Forward commands', () => {
  const REQUIRED = ['new-project.md', 'discuss-phase.md', 'plan-phase.md'];
  const dir = path.join(PROJECT_ROOT, 'commands/gtd/forward');

  for (const cmd of REQUIRED) {
    it(`has command: ${cmd}`, () => {
      expect(fs.existsSync(path.join(dir, cmd))).toBe(true);
    });
  }

  it('all commands have gtd- prefix in name', () => {
    for (const cmd of REQUIRED) {
      const content = fs.readFileSync(path.join(dir, cmd), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.name.startsWith('gtd-')).toBe(true);
    }
  });
});

// ================================================================
// Simulated forward pipeline
// ================================================================

describe('Simulated forward pipeline', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('simulates: new-project → discuss → plan → ready for execute', () => {
    // Step 1: New project
    writePlanningFile(temp.dir, 'PROJECT.md', '# Todo App\nA simple todo application.');
    writePlanningFile(temp.dir, 'REQUIREMENTS.md', `# Requirements
## v1 (Must-Have)
- REQ-AUTH-01: User registration and login
- REQ-TODO-01: CRUD operations for todos
- REQ-API-01: REST API endpoints
`);
    writePlanningFile(temp.dir, 'ROADMAP.md', `---
project: todo-app
---
# Roadmap
| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| 1 | Auth | Authentication REQ-AUTH-01 | pending |
| 2 | API | REST endpoints REQ-TODO-01 REQ-API-01 | pending |
| 3 | Frontend | UI components | pending |
`);
    updateState(temp.dir, { forward: { status: 'researched', current_milestone: 'v1.0' } });

    // Step 2: Discuss phase 1
    const phase1 = createPhase(temp.dir, 1, 'Auth');
    writePlanningFile(temp.dir, 'phases/01-auth/01-CONTEXT.md', `---
phase: 1
---
# Phase 1 Context: Auth
## Decisions
| # | Area | Decision |
|---|------|----------|
| 1 | Auth mechanism | JWT with refresh tokens |
| 2 | Password hashing | bcrypt |
`);

    // Step 3: Plan phase 1
    fs.writeFileSync(path.join(phase1, '01-01-db-schema-PLAN.md'), '# Plan: DB Schema\n## Tasks\n1. Create User table');
    fs.writeFileSync(path.join(phase1, '01-02-auth-routes-PLAN.md'), '# Plan: Auth Routes\n## Tasks\n1. POST /register\n2. POST /login');
    updateState(temp.dir, { forward: { status: 'planned', current_phase: 1 } });

    // Verify state
    const state = loadState(temp.dir);
    expect(state.forward.status).toBe('planned');
    expect(state.forward.current_phase).toBe(1);

    // Verify roadmap
    const rm = loadRoadmap(temp.dir);
    expect(rm.phases).toHaveLength(3);

    // Verify plans
    const plans = listPlans(phase1);
    expect(plans).toHaveLength(2);

    // Verify waves
    const waves = groupIntoWaves(plans, { 'auth-routes': ['db-schema'] });
    expect(waves).toHaveLength(2);
  });
});
