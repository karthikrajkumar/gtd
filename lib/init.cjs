/**
 * GTD Init Module — Assembles workflow context for agent orchestration.
 *
 * Each workflow type receives a tailored context payload containing only
 * the data it needs. This keeps agent prompts focused and avoids
 * loading unnecessary context into limited token windows.
 *
 * @module lib/init
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { findProjectRoot, fileExists, readFileOr, ensureDir } = require('./file-ops.cjs');
const { loadConfig } = require('./config.cjs');
const { loadState } = require('./state.cjs');
const { getAnalysisStatus, getCodebaseMapStatus } = require('./analysis.cjs');
const {
  getGitCommit,
  getGitBranch,
  hasUncommittedChanges,
  isGitRepo,
  getRemoteUrl,
} = require('./git.cjs');

/**
 * Workflow → required context dimensions mapping.
 * Each workflow only gets the context slices it needs.
 */
const WORKFLOW_CONTEXT = {
  // Backward workflows
  'scan-codebase': ['config', 'state', 'git'],
  'analyze-codebase': ['config', 'state', 'git', 'codebase_map', 'analysis_status'],
  'generate-document': ['config', 'state', 'git', 'codebase_map', 'analysis_status', 'doc_status'],
  'create-all': ['config', 'state', 'git', 'codebase_map', 'analysis_status', 'doc_status'],
  'verify-document': ['config', 'state', 'git', 'doc_status'],
  'review-document': ['config', 'state', 'doc_status'],
  'incremental-update': ['config', 'state', 'git', 'analysis_status', 'doc_status', 'git_diff'],

  // Forward workflows
  'new-project': ['config', 'state', 'git', 'codebase_map'],
  'discuss-phase': ['config', 'state', 'git', 'roadmap', 'phase_context'],
  'plan-phase': ['config', 'state', 'git', 'roadmap', 'phase_context', 'research'],
  'execute-phase': ['config', 'state', 'git', 'roadmap', 'phase_context', 'plans'],
  'verify-work': ['config', 'state', 'git', 'roadmap', 'phase_context', 'plans', 'summaries'],
  'deploy-local': ['config', 'state', 'git', 'codebase_map'],
  'test-phase': ['config', 'state', 'git', 'phase_context'],
  ship: ['config', 'state', 'git'],

  // Sync workflows
  'detect-drift': ['config', 'state', 'git', 'analysis_status', 'doc_status', 'roadmap'],
  reconcile: ['config', 'state', 'git', 'drift_report'],
  sync: ['config', 'state', 'git', 'drift_report'],
  audit: ['config', 'state', 'git', 'analysis_status', 'doc_status', 'roadmap'],

  // Utility workflows
  help: ['config', 'state'],
  status: ['config', 'state', 'analysis_status', 'doc_status'],
  settings: ['config'],
};

/**
 * Main init function — assembles context for a workflow.
 *
 * @param {string[]} args - [workflowName, ...workflowArgs]
 * @returns {void} Writes JSON to stdout
 */
function init(args) {
  const workflowName = args[0];
  const workflowArgs = args.slice(1);

  if (!workflowName) {
    process.stderr.write('Usage: gtd-tools.cjs init <workflow> [args...]\n');
    process.exit(1);
  }

  const projectRoot = findProjectRoot(process.cwd()) || process.cwd();
  const docsRoot = path.join(projectRoot, '.planning');

  // Base context — always present
  const context = {
    project_root: projectRoot,
    docs_root: docsRoot,
    workflow: workflowName,
    args: parseWorkflowArgs(workflowName, workflowArgs),
    timestamp: new Date().toISOString(),
    gtd_version: getGtdVersion(),
  };

  // Determine which context slices this workflow needs
  const needed = WORKFLOW_CONTEXT[workflowName] || ['config', 'state', 'git'];

  // Load each needed context slice
  if (needed.includes('config')) {
    context.config = loadConfig(docsRoot);
  }

  if (needed.includes('state')) {
    context.state = loadState(docsRoot);
  }

  if (needed.includes('git')) {
    context.git = buildGitContext(projectRoot);
  }

  if (needed.includes('codebase_map')) {
    context.codebase_map = getCodebaseMapStatus(docsRoot);
  }

  if (needed.includes('analysis_status')) {
    context.analysis_status = getAnalysisStatus(docsRoot);
  }

  if (needed.includes('doc_status')) {
    const state = context.state || loadState(docsRoot);
    context.documents = state.backward.documents;
  }

  if (needed.includes('roadmap')) {
    context.roadmap = loadArtifact(docsRoot, 'ROADMAP.md');
  }

  if (needed.includes('phase_context')) {
    context.phase = loadPhaseContext(docsRoot, context.args);
  }

  if (needed.includes('plans')) {
    context.plans = loadPhasePlans(docsRoot, context.args);
  }

  if (needed.includes('research')) {
    context.research = loadResearchSummary(docsRoot);
  }

  if (needed.includes('drift_report')) {
    context.drift_report = loadArtifact(docsRoot, 'DRIFT-REPORT.md');
  }

  // Resolve model tiers for this workflow
  if (context.config) {
    context.models = resolveModelsForWorkflow(workflowName, context.config);
  }

  // Output context
  outputContext(context);
}

/**
 * Build git context object.
 */
function buildGitContext(projectRoot) {
  if (!isGitRepo(projectRoot)) {
    return { available: false };
  }

  return {
    available: true,
    commit: getGitCommit(projectRoot),
    branch: getGitBranch(projectRoot),
    has_changes: hasUncommittedChanges(projectRoot),
    remote_url: getRemoteUrl(projectRoot),
  };
}

/**
 * Parse workflow-specific arguments.
 */
function parseWorkflowArgs(workflowName, args) {
  const parsed = { raw: args };

  // Extract common flags
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--auto' || arg === '-a') parsed.auto = true;
    else if (arg === '--force' || arg === '-f') parsed.force = true;
    else if (arg === '--parallel') parsed.parallel = true;
    else if (arg === '--deep') parsed.deep = true;
    else if (arg === '--format' && args[i + 1]) { parsed.format = args[++i]; }
    else if (arg === '--since' && args[i + 1]) { parsed.since = args[++i]; }
    else if (arg === '--focus' && args[i + 1]) { parsed.focus = args[++i]; }
    else if (arg === '--module' && args[i + 1]) { parsed.module = args[++i]; }
    else if (arg === '--wave' && args[i + 1]) { parsed.wave = parseInt(args[++i], 10); }
    else if (arg === '--strategy' && args[i + 1]) { parsed.strategy = args[++i]; }
    else if (arg === '--direction' && args[i + 1]) { parsed.direction = args[++i]; }
    else if (arg === '--include-tests') parsed.include_tests = true;
    else if (!arg.startsWith('-') && !parsed.positional) {
      parsed.positional = arg;
    }
  }

  // Workflow-specific positional arg interpretation
  if (parsed.positional) {
    if (['generate-document', 'verify-document', 'review-document'].includes(workflowName)) {
      parsed.doc_type = parsed.positional;
    } else if (
      ['discuss-phase', 'plan-phase', 'execute-phase', 'verify-work', 'test-phase'].includes(
        workflowName,
      )
    ) {
      parsed.phase_number = parseInt(parsed.positional, 10);
    }
  }

  return parsed;
}

/**
 * Load a planning artifact as a string (or null if missing).
 */
function loadArtifact(docsRoot, filename) {
  const filepath = path.join(docsRoot, filename);
  if (!fileExists(filepath)) return null;
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (_) {
    return null;
  }
}

/**
 * Load phase-specific context files.
 */
function loadPhaseContext(docsRoot, args) {
  const phaseNum = args.phase_number;
  if (!phaseNum) return null;

  const phasesDir = path.join(docsRoot, 'phases');
  if (!fs.existsSync(phasesDir)) return { phase_number: phaseNum, exists: false };

  // Find the phase directory (zero-padded: 01-, 02-, etc.)
  const padded = String(phaseNum).padStart(2, '0');
  const entries = fs.existsSync(phasesDir) ? fs.readdirSync(phasesDir) : [];
  const phaseDir = entries.find((e) => e.startsWith(padded + '-'));

  if (!phaseDir) return { phase_number: phaseNum, exists: false };

  const fullPhaseDir = path.join(phasesDir, phaseDir);

  return {
    phase_number: phaseNum,
    exists: true,
    directory: fullPhaseDir,
    context_file: loadArtifact(fullPhaseDir, `${padded}-CONTEXT.md`),
    research_file: loadArtifact(fullPhaseDir, `${padded}-RESEARCH.md`),
  };
}

/**
 * Load plan files from a phase directory.
 */
function loadPhasePlans(docsRoot, args) {
  const phaseNum = args.phase_number;
  if (!phaseNum) return null;

  const padded = String(phaseNum).padStart(2, '0');
  const phasesDir = path.join(docsRoot, 'phases');
  if (!fs.existsSync(phasesDir)) return [];

  const entries = fs.readdirSync(phasesDir);
  const phaseDir = entries.find((e) => e.startsWith(padded + '-'));
  if (!phaseDir) return [];

  const fullPhaseDir = path.join(phasesDir, phaseDir);
  const allFiles = fs.readdirSync(fullPhaseDir);
  const planFiles = allFiles.filter((f) => f.includes('-PLAN') && f.endsWith('.md'));

  return planFiles.map((f) => ({
    filename: f,
    path: path.join(fullPhaseDir, f),
  }));
}

/**
 * Load research summary if available.
 */
function loadResearchSummary(docsRoot) {
  const researchDir = path.join(docsRoot, 'research');
  if (!fs.existsSync(researchDir)) return null;

  return {
    summary: loadArtifact(researchDir, 'SUMMARY.md'),
    stack: loadArtifact(researchDir, 'STACK.md'),
    features: loadArtifact(researchDir, 'FEATURES.md'),
    architecture: loadArtifact(researchDir, 'ARCHITECTURE.md'),
    pitfalls: loadArtifact(researchDir, 'PITFALLS.md'),
  };
}

/**
 * Resolve model tiers for agents used in this workflow.
 */
function resolveModelsForWorkflow(workflowName, config) {
  const models = config.models || {};
  const backwardWorkflows = [
    'scan-codebase',
    'analyze-codebase',
    'generate-document',
    'create-all',
    'verify-document',
    'review-document',
    'incremental-update',
  ];
  const forwardWorkflows = [
    'new-project',
    'discuss-phase',
    'plan-phase',
    'execute-phase',
    'verify-work',
    'deploy-local',
    'test-phase',
    'ship',
  ];

  if (backwardWorkflows.includes(workflowName)) {
    return {
      analyzer: models.analyzer || 'sonnet',
      writer: models.writer || 'sonnet',
      verifier: models.verifier || 'haiku',
    };
  }

  if (forwardWorkflows.includes(workflowName)) {
    return {
      researcher: models.researcher || 'sonnet',
      planner: models.planner || 'sonnet',
      executor: models.executor || 'sonnet',
      verifier: models.verifier || 'haiku',
    };
  }

  return models;
}

/**
 * Output context as JSON, using @file: for large payloads.
 */
function outputContext(context) {
  const json = JSON.stringify(context, null, 2);

  if (json.length > 50000) {
    // Write to temp file to avoid overwhelming stdout
    const tmpDir = path.join(os.tmpdir(), 'gtd');
    ensureDir(tmpDir);
    const tmpFile = path.join(tmpDir, `init-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, json, 'utf8');
    process.stdout.write(`@file:${tmpFile}`);
  } else {
    process.stdout.write(json);
  }
}

/**
 * Get the GTD package version.
 */
function getGtdVersion() {
  try {
    const pkg = require('../package.json');
    return pkg.version;
  } catch (_) {
    return 'unknown';
  }
}

module.exports = init;
module.exports.buildGitContext = buildGitContext;
module.exports.parseWorkflowArgs = parseWorkflowArgs;
module.exports.WORKFLOW_CONTEXT = WORKFLOW_CONTEXT;
