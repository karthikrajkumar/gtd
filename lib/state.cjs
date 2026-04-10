/**
 * GTD State Machine — Manages .planning/STATE.md
 *
 * Tracks three independent pipelines: forward, backward, sync.
 * @module lib/state
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWrite, ensureDir } = require('./file-ops.cjs');
const { parseFrontmatter, serializeFrontmatter } = require('./frontmatter.cjs');

const STATE_FILE = 'STATE.md';

// --- Valid state transitions per pipeline ---

const FORWARD_TRANSITIONS = {
  empty: ['researched'],
  researched: ['planned'],
  planned: ['executing'],
  executing: ['deployed', 'tested', 'verified'],
  deployed: ['tested'],
  tested: ['verified'],
  verified: ['empty'], // New milestone starts fresh
};

const BACKWARD_TRANSITIONS = {
  empty: ['scanned'],
  scanned: ['analyzed', 'drafting'],
  analyzed: ['drafting'],
  drafting: ['review'],
  review: ['finalized', 'drafting'],
  finalized: ['stale'],
  stale: ['analyzed', 'scanned'],
};

const SYNC_TRANSITIONS = {
  synced: ['drifted'],
  drifted: ['reconciling'],
  reconciling: ['synced'],
};

/**
 * Default state structure.
 */
function defaultState() {
  return {
    mode: 'bidirectional',
    forward: {
      status: 'empty',
      current_phase: null,
      current_milestone: null,
    },
    backward: {
      status: 'empty',
      last_scan_commit: null,
      last_analysis_commit: null,
      documents: {},
    },
    sync: {
      status: 'synced',
      last_drift_check: null,
      drift_items: 0,
    },
    metrics: {
      total_tokens: 0,
      total_cost_usd: 0,
      agents_spawned: 0,
    },
  };
}

/**
 * Load state from .planning/STATE.md.
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {object} State object
 */
function loadState(docsRoot) {
  const statePath = path.join(docsRoot, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return defaultState();
  }

  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    // Reconstruct structured state from flat frontmatter
    return {
      mode: frontmatter.mode || 'bidirectional',
      forward: {
        status: frontmatter.forward_status || 'empty',
        current_phase: frontmatter.forward_current_phase || null,
        current_milestone: frontmatter.forward_current_milestone || null,
      },
      backward: {
        status: frontmatter.backward_status || 'empty',
        last_scan_commit: frontmatter.backward_last_scan_commit || null,
        last_analysis_commit: frontmatter.backward_last_analysis_commit || null,
        documents: frontmatter.backward_documents
          ? JSON.parse(frontmatter.backward_documents)
          : {},
      },
      sync: {
        status: frontmatter.sync_status || 'synced',
        last_drift_check: frontmatter.sync_last_drift_check || null,
        drift_items: frontmatter.sync_drift_items || 0,
      },
      metrics: {
        total_tokens: frontmatter.metrics_total_tokens || 0,
        total_cost_usd: frontmatter.metrics_total_cost_usd || 0,
        agents_spawned: frontmatter.metrics_agents_spawned || 0,
      },
    };
  } catch (_) {
    return defaultState();
  }
}

/**
 * Update state with partial updates (deep merge).
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {object} updates - Partial state updates
 * @returns {object} Merged state
 */
function updateState(docsRoot, updates) {
  const current = loadState(docsRoot);
  const merged = deepMergeState(current, updates);
  writeState(docsRoot, merged);
  return merged;
}

/**
 * Validate a state transition for a specific pipeline.
 * @param {string} pipeline - 'forward' | 'backward' | 'sync'
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean} Whether the transition is valid
 * @throws {Error} If transition is invalid
 */
function transition(pipeline, from, to) {
  const transitionMap =
    pipeline === 'forward'
      ? FORWARD_TRANSITIONS
      : pipeline === 'backward'
        ? BACKWARD_TRANSITIONS
        : SYNC_TRANSITIONS;

  const validTargets = transitionMap[from];
  if (!validTargets || !validTargets.includes(to)) {
    throw new Error(
      `Invalid ${pipeline} transition: ${from} -> ${to}. ` +
        `Valid targets from '${from}': ${validTargets ? validTargets.join(', ') : 'none'}`,
    );
  }
  return true;
}

/**
 * Get the status of a specific document.
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {string} docType - Document type (e.g., 'tdd', 'hld')
 * @returns {object|null} Document status or null
 */
function getDocumentStatus(docsRoot, docType) {
  const state = loadState(docsRoot);
  return state.backward.documents[docType] || null;
}

/**
 * Update the status of a specific document.
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {string} docType - Document type
 * @param {object} updates - Status updates
 */
function updateDocumentStatus(docsRoot, docType, updates) {
  const state = loadState(docsRoot);
  if (!state.backward.documents[docType]) {
    state.backward.documents[docType] = { status: 'pending', version: null, commit: null };
  }
  Object.assign(state.backward.documents[docType], updates);
  writeState(docsRoot, state);
}

/**
 * Get the overall pipeline status summary.
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {object} Pipeline summary
 */
function getPipelineStatus(docsRoot) {
  const state = loadState(docsRoot);
  return {
    forward: state.forward.status,
    backward: state.backward.status,
    sync: state.sync.status,
    mode: state.mode,
  };
}

// --- CLI handler ---

function run(args) {
  const projectRoot = process.cwd();
  const docsRoot = path.join(projectRoot, '.planning');
  const subcommand = args[0] || 'get';

  if (subcommand === 'get') {
    const state = loadState(docsRoot);
    process.stdout.write(JSON.stringify(state, null, 2));
  } else if (subcommand === 'pipeline') {
    const status = getPipelineStatus(docsRoot);
    process.stdout.write(JSON.stringify(status, null, 2));
  } else {
    process.stderr.write(`Unknown state subcommand: ${subcommand}\n`);
    process.exit(1);
  }
}

// --- Internal helpers ---

function writeState(docsRoot, state) {
  ensureDir(docsRoot);
  const statePath = path.join(docsRoot, STATE_FILE);

  // Flatten nested state to frontmatter-compatible flat keys
  const frontmatter = {
    mode: state.mode,
    forward_status: state.forward.status,
    forward_current_phase: state.forward.current_phase,
    forward_current_milestone: state.forward.current_milestone,
    backward_status: state.backward.status,
    backward_last_scan_commit: state.backward.last_scan_commit,
    backward_last_analysis_commit: state.backward.last_analysis_commit,
    backward_documents: JSON.stringify(state.backward.documents),
    sync_status: state.sync.status,
    sync_last_drift_check: state.sync.last_drift_check,
    sync_drift_items: state.sync.drift_items,
    metrics_total_tokens: state.metrics.total_tokens,
    metrics_total_cost_usd: state.metrics.total_cost_usd,
    metrics_agents_spawned: state.metrics.agents_spawned,
  };

  const body = renderStateBody(state);
  const content = serializeFrontmatter(frontmatter, body);
  atomicWrite(statePath, content);
}

function renderStateBody(state) {
  return `# GTD State

## Forward Pipeline
- **Status:** ${state.forward.status}
- **Current Phase:** ${state.forward.current_phase || 'none'}
- **Milestone:** ${state.forward.current_milestone || 'none'}

## Backward Pipeline
- **Status:** ${state.backward.status}
- **Last Scan Commit:** ${state.backward.last_scan_commit || 'never'}
- **Last Analysis Commit:** ${state.backward.last_analysis_commit || 'never'}

## Documents
| Document | Status | Version | Commit |
|----------|--------|---------|--------|
${renderDocumentTable(state.backward.documents)}

## Sync
- **Status:** ${state.sync.status}
- **Last Drift Check:** ${state.sync.last_drift_check || 'never'}
- **Drift Items:** ${state.sync.drift_items}

## Metrics
- **Total Tokens:** ${state.metrics.total_tokens.toLocaleString()}
- **Total Cost:** $${state.metrics.total_cost_usd.toFixed(2)}
- **Agents Spawned:** ${state.metrics.agents_spawned}
`;
}

function renderDocumentTable(documents) {
  const docTypes = ['tdd', 'hld', 'lld', 'capacity', 'system-design', 'api-docs', 'runbook'];
  return docTypes
    .map((type) => {
      const doc = documents[type] || { status: 'pending', version: '-', commit: '-' };
      return `| ${type} | ${doc.status} | ${doc.version || '-'} | ${doc.commit || '-'} |`;
    })
    .join('\n');
}

function deepMergeState(target, source) {
  const result = JSON.parse(JSON.stringify(target));
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      result[key] &&
      typeof result[key] === 'object'
    ) {
      result[key] = deepMergeState(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

module.exports = {
  defaultState,
  loadState,
  updateState,
  transition,
  getDocumentStatus,
  updateDocumentStatus,
  getPipelineStatus,
  run,
  FORWARD_TRANSITIONS,
  BACKWARD_TRANSITIONS,
  SYNC_TRANSITIONS,
};
