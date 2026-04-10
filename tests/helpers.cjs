/**
 * GTD Test Helpers — Shared utilities for all test files.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(PROJECT_ROOT, 'test-fixtures');

/**
 * Get the path to a test fixture project.
 * @param {string} name - Fixture name ('micro-project', 'small-project')
 * @returns {string} Absolute path to fixture
 */
function fixturePath(name) {
  const p = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Test fixture not found: ${name} (looked in ${p})`);
  }
  return p;
}

/**
 * Create a temporary .planning/ directory for testing.
 * @returns {{ dir: string, cleanup: () => void }}
 */
function createTempPlanningDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtd-test-'));
  const planningDir = path.join(dir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });

  return {
    root: dir,
    dir: planningDir,
    cleanup: () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (_) {
        // Ignore cleanup errors in tests
      }
    },
  };
}

/**
 * Create a mock git commit hash.
 * @returns {string} 7-character hex string
 */
function mockGitCommit() {
  return Math.random().toString(16).slice(2, 9);
}

/**
 * Read a file from a temp planning dir.
 * @param {string} planningDir - .planning/ path
 * @param {string} relativePath - Path relative to .planning/
 * @returns {string} File content
 */
function readPlanningFile(planningDir, relativePath) {
  return fs.readFileSync(path.join(planningDir, relativePath), 'utf8');
}

/**
 * Write a file to a temp planning dir.
 * @param {string} planningDir - .planning/ path
 * @param {string} relativePath - Path relative to .planning/
 * @param {string} content - File content
 */
function writePlanningFile(planningDir, relativePath, content) {
  const fullPath = path.join(planningDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

module.exports = {
  PROJECT_ROOT,
  FIXTURES_DIR,
  fixturePath,
  createTempPlanningDir,
  mockGitCommit,
  readPlanningFile,
  writePlanningFile,
};
