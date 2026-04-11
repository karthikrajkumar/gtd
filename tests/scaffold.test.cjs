/**
 * Phase 0 — Scaffold verification tests.
 * Ensures the project structure matches the design specification.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, fixturePath } = require('./helpers.cjs');

describe('Phase 0: Project Scaffolding', () => {
  describe('Directory structure', () => {
    const requiredDirs = [
      'bin',
      'lib',
      'lib/installers',
      'agents/forward',
      'agents/backward',
      'agents/sync',
      'commands/gtd/forward',
      'commands/gtd/backward',
      'commands/gtd/sync',
      'commands/gtd/utility',
      'workflows/forward',
      'workflows/backward',
      'workflows/sync',
      'references',
      'templates/forward',
      'templates/backward/tdd',
      'templates/backward/hld',
      'templates/backward/lld',
      'templates/backward/capacity',
      'templates/backward/system-design',
      'templates/backward/api-docs',
      'templates/backward/runbook',
      'contexts',
      'hooks',
      'sdk/src',
      'tests',
      'test-fixtures',
      'docs/design',
    ];

    for (const dir of requiredDirs) {
      it(`has directory: ${dir}`, () => {
        const fullPath = path.join(PROJECT_ROOT, dir);
        expect(fs.existsSync(fullPath), `Missing directory: ${dir}`).toBe(true);
      });
    }
  });

  describe('Core files', () => {
    const requiredFiles = [
      'package.json',
      '.gitignore',
      '.nvmrc',
      '.prettierrc',
      'vitest.config.ts',
      'bin/install.js',
      'bin/gtd-tools.cjs',
      'lib/file-ops.cjs',
      'lib/frontmatter.cjs',
      'lib/config.cjs',
      'lib/state.cjs',
      'lib/init.cjs',
      'lib/analysis.cjs',
      'lib/template.cjs',
      'lib/docs.cjs',
      'lib/phase.cjs',
      'lib/roadmap.cjs',
      'lib/deploy.cjs',
      'lib/test-runner.cjs',
      'lib/diff-engine.cjs',
      'lib/drift-engine.cjs',
      'lib/security.cjs',
    ];

    for (const file of requiredFiles) {
      it(`has file: ${file}`, () => {
        const fullPath = path.join(PROJECT_ROOT, file);
        expect(fs.existsSync(fullPath), `Missing file: ${file}`).toBe(true);
      });
    }
  });

  describe('package.json', () => {
    it('has correct name', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      expect(pkg.name).toContain('get-things-done');
    });

    it('has bin entry', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      expect(pkg.bin['get-things-done']).toBe('./bin/install.js');
    });

    it('has test script', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      expect(pkg.scripts.test).toContain('vitest');
    });

    it('requires Node >= 20', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      expect(pkg.engines.node).toBe('>=20.0.0');
    });
  });

  describe('Test fixtures', () => {
    it('micro-project exists and has package.json', () => {
      const p = fixturePath('micro-project');
      expect(fs.existsSync(path.join(p, 'package.json'))).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'));
      expect(pkg.name).toBe('micro-cli-tool');
    });

    it('micro-project has 3 source files', () => {
      const p = fixturePath('micro-project');
      expect(fs.existsSync(path.join(p, 'src/index.js'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'src/utils.js'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'package.json'))).toBe(true);
    });

    it('small-project exists and is an Express API', () => {
      const p = fixturePath('small-project');
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'));
      expect(pkg.name).toBe('todo-api');
      expect(pkg.dependencies).toHaveProperty('express');
      expect(pkg.dependencies).toHaveProperty('prisma');
    });

    it('small-project has routes, models, middleware', () => {
      const p = fixturePath('small-project');
      expect(fs.existsSync(path.join(p, 'src/routes/auth.js'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'src/routes/todos.js'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'src/models/user.js'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'src/middleware/auth.js'))).toBe(true);
    });

    it('small-project has infrastructure files', () => {
      const p = fixturePath('small-project');
      expect(fs.existsSync(path.join(p, 'Dockerfile'))).toBe(true);
      expect(fs.existsSync(path.join(p, 'prisma/schema.prisma'))).toBe(true);
      expect(fs.existsSync(path.join(p, '.github/workflows/ci.yml'))).toBe(true);
    });
  });
});
