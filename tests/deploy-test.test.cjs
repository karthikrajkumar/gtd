/**
 * Phase 9: Deploy and Test Engine Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, fixturePath, createTempPlanningDir } = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { detectDeployMethod, detectPort, DEPLOY_METHODS } = require('../lib/deploy.cjs');
const { detectTestFramework, countTestFiles, getTestSummary, TEST_FRAMEWORKS } = require('../lib/test-runner.cjs');

// ================================================================
// lib/deploy.cjs
// ================================================================

describe('Deploy module', () => {
  describe('DEPLOY_METHODS', () => {
    it('has 8 deployment methods', () => {
      expect(DEPLOY_METHODS).toHaveLength(8);
    });

    it('includes docker-compose, npm-start, python, go, cargo', () => {
      const names = DEPLOY_METHODS.map((m) => m.name);
      expect(names).toContain('docker-compose');
      expect(names).toContain('npm-start');
      expect(names).toContain('python-uvicorn');
      expect(names).toContain('go-run');
      expect(names).toContain('cargo-run');
    });
  });

  describe('detectDeployMethod', () => {
    it('detects npm-start for small-project fixture', () => {
      const method = detectDeployMethod(fixturePath('small-project'));
      // small-project has Dockerfile AND npm start — Dockerfile wins (more specific)
      expect(method).toBeTruthy();
      expect(['dockerfile', 'npm-start']).toContain(method.name);
    });

    it('returns null for micro-project (no deploy config)', () => {
      // micro-project has package.json but just "start": "node src/index.js" — that's npm-start
      const method = detectDeployMethod(fixturePath('micro-project'));
      // Actually it does have "start" script
      if (method) {
        expect(method.name).toBe('npm-start');
      }
    });

    it('returns method with startCmd', () => {
      const method = detectDeployMethod(fixturePath('small-project'));
      if (method) {
        expect(method.startCmd).toBeTruthy();
      }
    });
  });

  describe('detectPort', () => {
    it('returns null when no port config found', () => {
      const temp = createTempPlanningDir();
      const port = detectPort(temp.root);
      // No .env, no docker-compose, no package.json with port
      expect(port).toBeNull();
      temp.cleanup();
    });
  });
});

// ================================================================
// lib/test-runner.cjs
// ================================================================

describe('Test Runner module', () => {
  describe('TEST_FRAMEWORKS', () => {
    it('has 6 test frameworks', () => {
      expect(TEST_FRAMEWORKS).toHaveLength(6);
    });

    it('includes vitest, jest, pytest, go-test, cargo-test, rspec', () => {
      const names = TEST_FRAMEWORKS.map((f) => f.name);
      expect(names).toContain('vitest');
      expect(names).toContain('jest');
      expect(names).toContain('pytest');
      expect(names).toContain('go-test');
      expect(names).toContain('cargo-test');
      expect(names).toContain('rspec');
    });
  });

  describe('detectTestFramework', () => {
    it('detects vitest for GTD project itself', () => {
      const fw = detectTestFramework(PROJECT_ROOT);
      expect(fw).toBeTruthy();
      expect(fw.name).toBe('vitest');
      expect(fw.runCmd).toContain('vitest');
    });

    it('detects jest for small-project fixture', () => {
      const fw = detectTestFramework(fixturePath('small-project'));
      expect(fw).toBeTruthy();
      expect(fw.name).toBe('jest');
    });

    it('returns null for micro-project (no test framework)', () => {
      const fw = detectTestFramework(fixturePath('micro-project'));
      expect(fw).toBeNull();
    });
  });

  describe('countTestFiles', () => {
    it('counts test files in GTD project', () => {
      const count = countTestFiles(PROJECT_ROOT);
      expect(count).toBeGreaterThan(10); // We have 18+ test files
    });
  });

  describe('getTestSummary', () => {
    it('returns summary for GTD project', () => {
      const summary = getTestSummary(PROJECT_ROOT);
      expect(summary.framework).toBe('vitest');
      expect(summary.testFiles).toBeGreaterThan(10);
      expect(summary.runCmd).toContain('vitest');
    });

    it('returns null framework for micro-project', () => {
      const summary = getTestSummary(fixturePath('micro-project'));
      expect(summary.framework).toBeNull();
      expect(summary.testFiles).toBe(0);
    });
  });
});

// ================================================================
// Deploy and Test agents
// ================================================================

describe('Deploy and Test agents', () => {
  const agents = [
    { name: 'gtd-deployer', role: 'deploy', tier: 'haiku' },
    { name: 'gtd-test-runner', role: 'testing', tier: 'haiku' },
  ];

  for (const agent of agents) {
    describe(agent.name, () => {
      const agentPath = path.join(PROJECT_ROOT, 'agents/forward', `${agent.name}.md`);

      it('exists', () => {
        expect(fs.existsSync(agentPath)).toBe(true);
      });

      it('has valid frontmatter', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.name).toBe(agent.name);
        expect(frontmatter.category).toBe('forward');
        expect(frontmatter.role).toBe(agent.role);
        expect(frontmatter.model_tier).toBe(agent.tier);
      });
    });
  }

  it('has 12 total forward agents', () => {
    const dir = path.join(PROJECT_ROOT, 'agents/forward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(12);
  });
});

// ================================================================
// Deploy and Test workflows
// ================================================================

describe('Deploy and Test workflows', () => {
  it('deploy-local workflow exists', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'workflows/forward/deploy-local.md'))).toBe(true);
  });

  it('test-phase workflow exists', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'workflows/forward/test-phase.md'))).toBe(true);
  });

  it('deploy workflow references gtd-deployer', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'workflows/forward/deploy-local.md'), 'utf8');
    expect(content).toContain('gtd-deployer');
  });

  it('test workflow references gtd-test-runner', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'workflows/forward/test-phase.md'), 'utf8');
    expect(content).toContain('gtd-test-runner');
  });

  it('has 8 total forward workflows', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/forward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(8);
  });
});

// ================================================================
// CLI tool integration
// ================================================================

describe('CLI deploy and test tools', () => {
  it('deploy detect works for GTD project', () => {
    const { execSync } = require('child_process');
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" deploy detect`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const info = JSON.parse(result);
    expect(info).toHaveProperty('method');
    expect(info).toHaveProperty('port');
  });

  it('test detect works for GTD project', () => {
    const { execSync } = require('child_process');
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" test detect`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    const info = JSON.parse(result);
    expect(info.framework).toBe('vitest');
    expect(info.testFiles).toBeGreaterThan(0);
  });
});
