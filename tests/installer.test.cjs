/**
 * Phase 12: Installer Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { PROJECT_ROOT, createTempPlanningDir } = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const {
  PACKAGE_ROOT,
  INSTALL_DIRS,
  copyFrameworkFiles,
  verifyInstallation,
  writeVersionMarker,
  getInstalledVersion,
  removeInstallation,
} = require('../lib/installer-core.cjs');

// Helper: create temp install directory
function createTempInstallDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtd-install-'));
  return {
    dir,
    cleanup: () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} },
  };
}

// ================================================================
// Installer Core
// ================================================================

describe('Installer Core', () => {
  describe('PACKAGE_ROOT', () => {
    it('points to project root', () => {
      expect(PACKAGE_ROOT).toBe(PROJECT_ROOT);
    });
  });

  describe('INSTALL_DIRS', () => {
    it('includes all agent directories', () => {
      expect(INSTALL_DIRS).toContain('agents/forward');
      expect(INSTALL_DIRS).toContain('agents/backward');
      expect(INSTALL_DIRS).toContain('agents/sync');
    });

    it('includes all workflow directories', () => {
      expect(INSTALL_DIRS).toContain('workflows/forward');
      expect(INSTALL_DIRS).toContain('workflows/backward');
      expect(INSTALL_DIRS).toContain('workflows/sync');
    });

    it('includes references and contexts', () => {
      expect(INSTALL_DIRS).toContain('references');
      expect(INSTALL_DIRS).toContain('contexts');
    });

    it('includes template directories', () => {
      const templateDirs = INSTALL_DIRS.filter((d) => d.startsWith('templates/'));
      expect(templateDirs.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('copyFrameworkFiles', () => {
    let temp;
    beforeEach(() => { temp = createTempInstallDir(); });
    afterEach(() => { temp.cleanup(); });

    it('copies files to destination', () => {
      const result = copyFrameworkFiles(temp.dir);
      expect(result.copied).toBeGreaterThan(50); // Should copy 100+ files
      expect(result.errors).toHaveLength(0);
    });

    it('creates directory structure', () => {
      copyFrameworkFiles(temp.dir);
      expect(fs.existsSync(path.join(temp.dir, 'agents/forward'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'agents/backward'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'agents/sync'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'workflows/forward'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'references'))).toBe(true);
    });

    it('copies gtd-tools.cjs', () => {
      copyFrameworkFiles(temp.dir);
      expect(fs.existsSync(path.join(temp.dir, 'bin/gtd-tools.cjs'))).toBe(true);
    });

    it('copies agent definitions', () => {
      copyFrameworkFiles(temp.dir);
      expect(fs.existsSync(path.join(temp.dir, 'agents/backward/gtd-codebase-mapper.md'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'agents/forward/gtd-executor.md'))).toBe(true);
      expect(fs.existsSync(path.join(temp.dir, 'agents/sync/gtd-drift-detector.md'))).toBe(true);
    });
  });

  describe('verifyInstallation', () => {
    let temp;
    beforeEach(() => { temp = createTempInstallDir(); });
    afterEach(() => { temp.cleanup(); });

    it('fails verification for empty directory', () => {
      const result = verifyInstallation(temp.dir);
      expect(result.ok).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('passes verification after copyFrameworkFiles', () => {
      copyFrameworkFiles(temp.dir);
      const result = verifyInstallation(temp.dir);
      expect(result.ok).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.found).toBe(result.total);
    });
  });

  describe('version marker', () => {
    let temp;
    beforeEach(() => { temp = createTempInstallDir(); });
    afterEach(() => { temp.cleanup(); });

    it('writes and reads version', () => {
      writeVersionMarker(temp.dir, '1.2.3');
      expect(getInstalledVersion(temp.dir)).toBe('1.2.3');
    });

    it('returns null when no version marker', () => {
      expect(getInstalledVersion(temp.dir)).toBeNull();
    });
  });

  describe('removeInstallation', () => {
    let temp;
    beforeEach(() => { temp = createTempInstallDir(); });
    afterEach(() => { temp.cleanup(); });

    it('removes installed directory', () => {
      copyFrameworkFiles(temp.dir);
      expect(fs.existsSync(temp.dir)).toBe(true);
      removeInstallation(temp.dir);
      expect(fs.existsSync(temp.dir)).toBe(false);
    });
  });
});

// ================================================================
// Runtime adapters
// ================================================================

describe('Runtime adapters', () => {
  const ADAPTER_FILES = [
    'lib/installers/claude.cjs',
    'lib/installers/opencode.cjs',
    'lib/installers/gemini.cjs',
    'lib/installers/codex.cjs',
    'lib/installers/copilot.cjs',
    'lib/installers/cursor.cjs',
    'lib/installers/windsurf.cjs',
    'lib/installers/augment.cjs',
    'lib/installers/cline.cjs',
  ];

  for (const adapterFile of ADAPTER_FILES) {
    const name = path.basename(adapterFile, '.cjs');

    describe(name, () => {
      it('exists', () => {
        expect(fs.existsSync(path.join(PROJECT_ROOT, adapterFile)), `Missing: ${adapterFile}`).toBe(true);
      });

      it('exports getInstallPath function', () => {
        const adapter = require(path.join(PROJECT_ROOT, adapterFile));
        expect(typeof adapter.getInstallPath).toBe('function');
      });

      it('getInstallPath returns string for global', () => {
        const adapter = require(path.join(PROJECT_ROOT, adapterFile));
        const p = adapter.getInstallPath('global');
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      });

      it('getInstallPath returns string for local', () => {
        const adapter = require(path.join(PROJECT_ROOT, adapterFile));
        const p = adapter.getInstallPath('local');
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      });

      it('global path uses home directory', () => {
        const adapter = require(path.join(PROJECT_ROOT, adapterFile));
        const p = adapter.getInstallPath('global');
        expect(p.startsWith(os.homedir()) || p.startsWith('~')).toBe(true);
      });

      it('exports name string', () => {
        const adapter = require(path.join(PROJECT_ROOT, adapterFile));
        expect(typeof adapter.name).toBe('string');
      });
    });
  }

  it('has 9 adapter files', () => {
    const dir = path.join(PROJECT_ROOT, 'lib/installers');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.cjs'));
    expect(files).toHaveLength(9);
  });
});

// ================================================================
// install.js CLI
// ================================================================

describe('install.js CLI', () => {
  it('--version outputs version', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/install.js')}" --version`,
      { encoding: 'utf8' }
    ).trim();
    expect(result).toContain('get-things-done v');
  });

  it('--help outputs usage', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/install.js')}" --help`,
      { encoding: 'utf8' }
    );
    expect(result).toContain('Usage');
    expect(result).toContain('--claude');
    expect(result).toContain('--all');
    expect(result).toContain('--global');
  });
});

// ================================================================
// End-to-end install test
// ================================================================

describe('End-to-end install to temp directory', () => {
  let temp;
  beforeEach(() => { temp = createTempInstallDir(); });
  afterEach(() => { temp.cleanup(); });

  it('installs and verifies successfully', () => {
    // Simulate what the installer does for Claude Code
    const adapter = require(path.join(PROJECT_ROOT, 'lib/installers/claude.cjs'));
    const installPath = temp.dir; // Use temp dir instead of real path

    const { copied, errors } = copyFrameworkFiles(installPath);
    expect(copied).toBeGreaterThan(50);
    expect(errors).toHaveLength(0);

    writeVersionMarker(installPath, '0.0.1');
    expect(getInstalledVersion(installPath)).toBe('0.0.1');

    const health = verifyInstallation(installPath);
    expect(health.ok).toBe(true);

    // Verify key files exist
    expect(fs.existsSync(path.join(installPath, 'bin/gtd-tools.cjs'))).toBe(true);
    expect(fs.existsSync(path.join(installPath, 'agents/backward/gtd-tdd-writer.md'))).toBe(true);
    expect(fs.existsSync(path.join(installPath, 'agents/forward/gtd-executor.md'))).toBe(true);
    expect(fs.existsSync(path.join(installPath, 'agents/sync/gtd-drift-detector.md'))).toBe(true);
    expect(fs.existsSync(path.join(installPath, 'references/framework-signatures.md'))).toBe(true);
    expect(fs.existsSync(path.join(installPath, 'templates/backward/tdd/standard.md'))).toBe(true);
  });
});
