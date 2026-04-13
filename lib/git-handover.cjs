/**
 * GTD Git Handover — Commit workspace state and push to GitHub.
 *
 * Called by the orchestrator's LLM via gtd_handover MCP tool.
 * Runs INSIDE the sandbox container with cwd = /workspace.
 *
 * Three modes:
 *   A — Push to new branch (default: main) on a remote URL
 *   B — Push to a named feature branch
 *   C — Push to feature branch (PR creation is done by orchestrator via GitHub API)
 *
 * @module lib/git-handover
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Run a git command in the project directory.
 * @param {string} cmd
 * @param {string} cwd
 * @returns {string}
 */
function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd,
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`git ${cmd.split(' ')[0]} failed: ${err.stderr || err.message}`);
  }
}

/**
 * Ensure the workspace is a git repo with an identity set.
 */
function ensureGitReady(cwd) {
  try {
    git('rev-parse --git-dir', cwd);
  } catch {
    git('init', cwd);
  }

  // Set identity if not set
  try {
    git('config user.email', cwd);
  } catch {
    git('config user.email "gtd@orchestrator"', cwd);
    git('config user.name "GTD Orchestrator"', cwd);
  }
}

/**
 * Stage all changes and create a commit.
 * @param {string} cwd
 * @param {string} message
 * @returns {{ commitSha: string, filesChanged: number }}
 */
function commitAll(cwd, message) {
  git('add -A', cwd);

  // Check if there's anything to commit
  const status = git('status --porcelain', cwd);
  if (!status) {
    // Nothing to commit — get current HEAD
    const sha = git('rev-parse HEAD', cwd);
    return { commitSha: sha, filesChanged: 0 };
  }

  git(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
  const sha = git('rev-parse HEAD', cwd);
  const filesChanged = status.split('\n').filter(Boolean).length;

  return { commitSha: sha, filesChanged };
}

/**
 * Main handover handler.
 *
 * @param {string[]} args - CLI args: [mode, remoteUrl, ...options]
 *   mode: A | B | C
 *   remoteUrl: https://github.com/... (with token embedded for auth)
 *   --branch <name>: branch name (default: main for A, gtd/<timestamp> for B/C)
 *   --message <msg>: commit message
 */
function run(args) {
  const mode = (args[0] || 'A').toUpperCase();
  const remoteUrl = args[1];
  const cwd = process.cwd();

  if (!remoteUrl) {
    const result = {
      success: false,
      error: 'Remote URL is required. Pass an authenticated URL (token embedded).',
      usage: 'gtd-tools.cjs git-handover <mode> <remoteUrl> [--branch <name>] [--message <msg>]',
    };
    process.stdout.write(JSON.stringify(result));
    return;
  }

  // Parse flags
  let branchName = null;
  let commitMessage = null;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--branch' && args[i + 1]) {
      branchName = args[++i];
    } else if (args[i] === '--message' && args[i + 1]) {
      commitMessage = args[++i];
    }
  }

  try {
    ensureGitReady(cwd);

    // Default branch names
    if (!branchName) {
      if (mode === 'A') {
        branchName = 'main';
      } else {
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        branchName = `gtd/${ts}`;
      }
    }

    // Default commit message
    if (!commitMessage) {
      commitMessage = `feat: GTD orchestrator output (${mode === 'A' ? 'initial' : 'update'})`;
    }

    // Check if .planning/ exists (include it in handover)
    const planningExists = fs.existsSync(path.join(cwd, '.planning'));

    let result;

    switch (mode) {
      case 'A':
        result = handleModeA(cwd, remoteUrl, branchName, commitMessage);
        break;
      case 'B':
      case 'C':
        result = handleModeBorC(cwd, remoteUrl, branchName, commitMessage, mode);
        break;
      default:
        result = { success: false, error: `Unknown mode: ${mode}. Use A, B, or C.` };
    }

    result.planningIncluded = planningExists;
    process.stdout.write(JSON.stringify(result));
  } catch (err) {
    const result = { success: false, error: err.message };
    process.stdout.write(JSON.stringify(result));
  }
}

/**
 * Mode A — Push to remote (typically new repo, main branch).
 */
function handleModeA(cwd, remoteUrl, branchName, message) {
  // Commit everything
  const { commitSha, filesChanged } = commitAll(cwd, message);

  // Set remote
  try {
    git('remote remove origin', cwd);
  } catch { /* no existing remote */ }
  git(`remote add origin ${remoteUrl}`, cwd);

  // Ensure we're on the right branch
  try {
    git(`branch -M ${branchName}`, cwd);
  } catch { /* already on branch */ }

  // Push
  git(`push -u origin ${branchName} --force`, cwd);

  return {
    success: true,
    mode: 'A',
    branch: branchName,
    commitSha,
    filesChanged,
    remoteUrl: sanitizeUrl(remoteUrl),
  };
}

/**
 * Mode B/C — Push to feature branch.
 * (PR creation is the orchestrator's responsibility, not ours.)
 */
function handleModeBorC(cwd, remoteUrl, branchName, message, mode) {
  // Commit everything
  const { commitSha, filesChanged } = commitAll(cwd, message);

  // Set remote
  try {
    git('remote remove origin', cwd);
  } catch { /* */ }
  git(`remote add origin ${remoteUrl}`, cwd);

  // Fetch to know about existing branches
  try {
    git('fetch origin', cwd);
  } catch { /* new repo, no branches yet */ }

  // Create and switch to feature branch
  git(`checkout -B ${branchName}`, cwd);

  // Push
  git(`push -u origin ${branchName} --force`, cwd);

  const result = {
    success: true,
    mode,
    branch: branchName,
    commitSha,
    filesChanged,
    remoteUrl: sanitizeUrl(remoteUrl),
  };

  if (mode === 'C') {
    result.prReady = true;
    result.prHint = `Create PR: ${branchName} -> main (orchestrator should call GitHub API)`;
  }

  return result;
}

/**
 * Strip tokens from URL for safe logging/output.
 */
function sanitizeUrl(url) {
  return url.replace(/\/\/[^@]+@/, '//***@');
}

module.exports = { run };
