/**
 * GTD Git Integration — Git operations for state tracking and change detection.
 * @module lib/git
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

/**
 * Execute a git command and return stdout trimmed.
 * Returns null on any error (not a git repo, git not installed, etc.)
 *
 * @param {string} command - Git command (without 'git' prefix)
 * @param {string} cwd - Working directory
 * @returns {string|null}
 */
function git(command, cwd) {
  try {
    return execSync(`git ${command}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    }).trim();
  } catch (_) {
    return null;
  }
}

/**
 * Get the current short commit hash.
 * @param {string} projectRoot - Project root directory
 * @returns {string|null} 7-character commit hash or null
 */
function getGitCommit(projectRoot) {
  return git('rev-parse --short HEAD', projectRoot);
}

/**
 * Get the full commit hash.
 * @param {string} projectRoot - Project root directory
 * @returns {string|null} Full commit hash or null
 */
function getGitCommitFull(projectRoot) {
  return git('rev-parse HEAD', projectRoot);
}

/**
 * Get the current branch name.
 * @param {string} projectRoot - Project root directory
 * @returns {string|null} Branch name or null
 */
function getGitBranch(projectRoot) {
  return git('rev-parse --abbrev-ref HEAD', projectRoot);
}

/**
 * Check if there are uncommitted changes (staged or unstaged).
 * @param {string} projectRoot - Project root directory
 * @returns {boolean}
 */
function hasUncommittedChanges(projectRoot) {
  const status = git('status --porcelain', projectRoot);
  return status !== null && status.length > 0;
}

/**
 * Get the list of files changed between two commits.
 * @param {string} projectRoot - Project root directory
 * @param {string} fromCommit - Starting commit hash
 * @param {string} [toCommit='HEAD'] - Ending commit hash
 * @returns {string[]} Array of changed file paths (relative to project root)
 */
function getChangedFiles(projectRoot, fromCommit, toCommit = 'HEAD') {
  const output = git(`diff --name-only ${fromCommit}..${toCommit}`, projectRoot);
  if (!output) return [];
  return output.split('\n').filter((line) => line.length > 0);
}

/**
 * Get recent commit messages for context.
 * @param {string} projectRoot - Project root directory
 * @param {number} [count=10] - Number of commits to retrieve
 * @returns {Array<{hash: string, message: string}>}
 */
function getRecentCommits(projectRoot, count = 10) {
  const output = git(`log --oneline -${count}`, projectRoot);
  if (!output) return [];
  return output.split('\n').filter(Boolean).map((line) => {
    const spaceIndex = line.indexOf(' ');
    return {
      hash: line.slice(0, spaceIndex),
      message: line.slice(spaceIndex + 1),
    };
  });
}

/**
 * Check if a directory is inside a git repository.
 * @param {string} dir - Directory to check
 * @returns {boolean}
 */
function isGitRepo(dir) {
  return git('rev-parse --is-inside-work-tree', dir) === 'true';
}

/**
 * Get the git root directory.
 * @param {string} dir - Directory to start from
 * @returns {string|null} Git root path or null
 */
function getGitRoot(dir) {
  return git('rev-parse --show-toplevel', dir);
}

/**
 * Get the remote origin URL.
 * @param {string} projectRoot - Project root directory
 * @returns {string|null}
 */
function getRemoteUrl(projectRoot) {
  return git('remote get-url origin', projectRoot);
}

module.exports = {
  getGitCommit,
  getGitCommitFull,
  getGitBranch,
  hasUncommittedChanges,
  getChangedFiles,
  getRecentCommits,
  isGitRepo,
  getGitRoot,
  getRemoteUrl,
};
