/**
 * Tests for lib/git.cjs
 */

'use strict';

const path = require('path');
const { createTempPlanningDir } = require('./helpers.cjs');
const {
  getGitCommit,
  getGitBranch,
  hasUncommittedChanges,
  isGitRepo,
  getGitRoot,
} = require('../lib/git.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('isGitRepo', () => {
  it('returns true for actual git repo', () => {
    expect(isGitRepo(PROJECT_ROOT)).toBe(true);
  });

  it('returns false for non-git directory', () => {
    const temp = createTempPlanningDir();
    expect(isGitRepo(temp.root)).toBe(false);
    temp.cleanup();
  });
});

describe('getGitCommit', () => {
  it('returns a commit hash for git repo', () => {
    const commit = getGitCommit(PROJECT_ROOT);
    // May be null if no commits yet, or a string
    if (commit) {
      expect(commit.length).toBe(7); // short hash
      expect(commit).toMatch(/^[a-f0-9]+$/);
    }
  });

  it('returns null for non-git directory', () => {
    const temp = createTempPlanningDir();
    expect(getGitCommit(temp.root)).toBeNull();
    temp.cleanup();
  });
});

describe('getGitBranch', () => {
  it('returns a branch name for git repo', () => {
    const branch = getGitBranch(PROJECT_ROOT);
    if (branch) {
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    }
  });

  it('returns null for non-git directory', () => {
    const temp = createTempPlanningDir();
    expect(getGitBranch(temp.root)).toBeNull();
    temp.cleanup();
  });
});

describe('hasUncommittedChanges', () => {
  it('returns a boolean for git repo', () => {
    const result = hasUncommittedChanges(PROJECT_ROOT);
    expect(typeof result).toBe('boolean');
  });
});

describe('getGitRoot', () => {
  it('returns root for git repo', () => {
    const root = getGitRoot(PROJECT_ROOT);
    expect(root).toBeTruthy();
    expect(root).toBe(PROJECT_ROOT);
  });

  it('returns null for non-git directory', () => {
    const temp = createTempPlanningDir();
    expect(getGitRoot(temp.root)).toBeNull();
    temp.cleanup();
  });
});
