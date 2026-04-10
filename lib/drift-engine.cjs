/**
 * GTD Drift Engine — Spec-code drift detection, categorization, reconciliation planning.
 *
 * Drift = difference between what specs/docs SAY and what code DOES.
 * This is GTD's killer differentiator — no other framework detects this.
 *
 * @module lib/drift-engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { fileExists } = require('./file-ops.cjs');
const { parseFrontmatter } = require('./frontmatter.cjs');

/**
 * Drift categories.
 */
const DRIFT_CATEGORIES = {
  ADDITION: 'Code has something that specs/docs do not mention',
  REMOVAL: 'Specs/docs mention something that code does not have',
  MUTATION: 'Both exist but behavior or structure differs',
  STRUCTURAL: 'Architecture changed (new service, removed layer, different pattern)',
};

/**
 * Drift severity levels.
 */
const SEVERITY = {
  CRITICAL: 'Fundamental architectural change or security implication',
  MAJOR: 'Significant feature or behavior difference',
  MINOR: 'Small discrepancy, cosmetic or naming difference',
  INFO: 'Informational — code improved beyond spec',
};

/**
 * Check if drift detection is needed.
 * @param {string} docsRoot - .planning/ directory
 * @returns {{ needed: boolean, reason: string, lastCheck: string|null }}
 */
function isDriftCheckNeeded(docsRoot) {
  const statePath = path.join(docsRoot, 'STATE.md');
  if (!fileExists(statePath)) {
    return { needed: false, reason: 'No state file — nothing to compare' };
  }

  const content = fs.readFileSync(statePath, 'utf8');
  const { frontmatter } = parseFrontmatter(content);

  const lastDriftCheck = frontmatter.sync_last_drift_check || null;
  const lastScanCommit = frontmatter.backward_last_scan_commit || null;
  const forwardStatus = frontmatter.forward_status || 'empty';

  if (forwardStatus === 'empty' && !lastScanCommit) {
    return { needed: false, reason: 'No forward or backward state — nothing to compare' };
  }

  if (!lastDriftCheck) {
    return { needed: true, reason: 'Drift check has never been run', lastCheck: null };
  }

  try {
    const { getGitCommit } = require('./git.cjs');
    const currentCommit = getGitCommit(path.dirname(docsRoot));
    if (currentCommit && frontmatter.sync_last_drift_commit !== currentCommit) {
      return { needed: true, reason: 'Code changed since last drift check', lastCheck: lastDriftCheck };
    }
  } catch (_) {}

  return { needed: false, reason: 'Drift check is current', lastCheck: lastDriftCheck };
}

/**
 * Build context for the drift-detector agent.
 * @param {string} docsRoot - .planning/ directory
 * @returns {object} Context for drift detection
 */
function buildDriftContext(docsRoot) {
  const context = { hasSpecs: false, hasDocs: false, hasCode: false, specs: {}, docs: {} };

  // Forward specs
  for (const [key, file] of [['requirements', 'REQUIREMENTS.md'], ['roadmap', 'ROADMAP.md'], ['project', 'PROJECT.md']]) {
    if (fileExists(path.join(docsRoot, file))) {
      context.hasSpecs = true;
      context.specs[key] = path.join(docsRoot, file);
    }
  }

  // Backward docs
  const docsDir = path.join(docsRoot, 'documents');
  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    if (docFiles.length > 0) {
      context.hasDocs = true;
      for (const f of docFiles) {
        context.docs[f.replace('.md', '').toLowerCase()] = path.join(docsDir, f);
      }
    }
  }

  if (fileExists(path.join(docsRoot, 'CODEBASE-MAP.md'))) context.hasCode = true;
  return context;
}

/**
 * Parse a DRIFT-REPORT.md file.
 * @param {string} docsRoot - .planning/ directory
 * @returns {{ exists: boolean, items: Array, summary: object }}
 */
function parseDriftReport(docsRoot) {
  const reportPath = path.join(docsRoot, 'DRIFT-REPORT.md');
  if (!fileExists(reportPath)) {
    return { exists: false, items: [], summary: { total: 0, critical: 0, major: 0, minor: 0, info: 0 } };
  }

  const content = fs.readFileSync(reportPath, 'utf8');
  const { frontmatter } = parseFrontmatter(content);

  return {
    exists: true,
    items: frontmatter.drift_items ? JSON.parse(frontmatter.drift_items) : [],
    summary: {
      total: frontmatter.total_items || 0,
      critical: frontmatter.critical || 0,
      major: frontmatter.major || 0,
      minor: frontmatter.minor || 0,
      info: frontmatter.info || 0,
    },
    timestamp: frontmatter.timestamp || null,
  };
}

/**
 * Reconciliation strategies.
 */
const RECONCILIATION_STRATEGIES = {
  'code-wins': 'Update specs and docs to match current code (most common)',
  'spec-wins': 'Generate tasks to update code to match spec',
  interactive: 'Present each drift item to user for individual decision',
};

/**
 * Get reconciliation actions for a drift category.
 * @param {string} category - ADDITION, REMOVAL, MUTATION, STRUCTURAL
 * @returns {Array<{action: string, description: string}>}
 */
function getReconciliationActions(category) {
  const ACTIONS = {
    ADDITION: [
      { action: 'add-to-spec', description: 'Add to REQUIREMENTS.md and update ROADMAP.md' },
      { action: 'remove-code', description: 'Create task to remove the undocumented code' },
      { action: 'ignore', description: 'Acknowledge and mark as intentional' },
    ],
    REMOVAL: [
      { action: 'implement', description: 'Create task to implement the missing feature' },
      { action: 'remove-from-spec', description: 'Remove from REQUIREMENTS.md (descoped)' },
      { action: 'defer', description: 'Move to v2/future scope' },
    ],
    MUTATION: [
      { action: 'update-spec', description: 'Update spec to match code behavior' },
      { action: 'update-code', description: 'Create task to fix code to match spec' },
      { action: 'document', description: 'Document the difference as intentional deviation' },
    ],
    STRUCTURAL: [
      { action: 'update-all', description: 'Update all specs, docs, and diagrams' },
      { action: 'revert', description: 'Create task to revert architectural change' },
      { action: 'accept', description: 'Accept new architecture, update everything' },
    ],
  };
  return ACTIONS[category] || [{ action: 'ignore', description: 'No action needed' }];
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'check';

  if (subcommand === 'check') {
    process.stdout.write(JSON.stringify(isDriftCheckNeeded(docsRoot), null, 2));
  } else if (subcommand === 'context') {
    process.stdout.write(JSON.stringify(buildDriftContext(docsRoot), null, 2));
  } else if (subcommand === 'report') {
    process.stdout.write(JSON.stringify(parseDriftReport(docsRoot), null, 2));
  } else if (subcommand === 'actions' && args[1]) {
    process.stdout.write(JSON.stringify(getReconciliationActions(args[1]), null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs drift <check|context|report|actions> [category]\n');
    process.exit(1);
  }
}

module.exports = {
  DRIFT_CATEGORIES,
  SEVERITY,
  RECONCILIATION_STRATEGIES,
  isDriftCheckNeeded,
  buildDriftContext,
  parseDriftReport,
  getReconciliationActions,
  run,
};
