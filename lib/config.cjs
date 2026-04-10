/**
 * GTD Configuration Module — Manages .planning/config.json
 *
 * Pattern: absent = enabled (missing keys default to their standard values).
 * @module lib/config
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWrite, ensureDir } = require('./file-ops.cjs');

const CONFIG_FILE = 'config.json';

/**
 * Default configuration — all three modes (backward, forward, sync).
 * Missing keys in user config fall through to these defaults.
 */
const DEFAULTS = {
  // Shared
  project: {
    name: null,
    description: null,
  },
  models: {
    analyzer: 'sonnet',
    writer: 'sonnet',
    verifier: 'haiku',
    researcher: 'sonnet',
    planner: 'sonnet',
    executor: 'sonnet',
  },
  workflow: {
    parallelization: true,
    require_verification: true,
    require_review: true,
  },

  // Backward-specific
  scan: {
    exclude_patterns: ['node_modules', 'dist', '.git', '*.lock', 'coverage', '.planning'],
    include_tests: false,
    max_file_size_kb: 500,
    max_files: 10000,
  },
  analysis: {
    dimensions: [
      'architecture',
      'api',
      'data-flow',
      'dependencies',
      'security',
      'performance',
    ],
    depth: 'standard',
    language_specific: true,
  },
  documents: {
    format: 'standard',
    output_dir: '.planning/documents',
    diagram_format: 'mermaid',
    include_code_snippets: true,
    max_snippet_lines: 30,
  },

  // Forward-specific
  planning: {
    granularity: 'standard',
    research_agents: 4,
    discussion_mode: 'guided',
  },
  execution: {
    branching_strategy: 'phase-branch',
    commit_docs: true,
    use_worktrees: true,
  },
  deploy: {
    method: 'auto',
    port: null,
    health_check_path: '/health',
    env_file: '.env',
  },
  testing: {
    framework: 'auto',
    coverage_threshold: 80,
    e2e_enabled: false,
  },

  // Sync-specific
  sync: {
    auto_sync: false,
    drift_check_on_execute: true,
    reconciliation_strategy: 'interactive',
  },
};

/**
 * Load config from .planning/config.json, merged with defaults.
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {object} Merged config
 */
function loadConfig(docsRoot) {
  const configPath = path.join(docsRoot, CONFIG_FILE);
  let userConfig = {};

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    userConfig = JSON.parse(raw);
  } catch (_) {
    // No config file or invalid JSON — use all defaults
  }

  return deepMerge(DEFAULTS, userConfig);
}

/**
 * Get a config value by dot-notation key.
 * Falls back to defaults for missing keys.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {string} dotPath - Dot-notation key (e.g., "scan.max_files")
 * @returns {*} Config value
 */
function get(docsRoot, dotPath) {
  if (typeof docsRoot !== 'string' && Array.isArray(docsRoot)) {
    // Called from CLI: args = [dotPath]
    const args = docsRoot;
    const projectRoot = process.cwd();
    const planningRoot = path.join(projectRoot, '.planning');
    const key = args[0];
    const value = getNestedValue(loadConfig(planningRoot), key);
    process.stdout.write(JSON.stringify(value));
    return;
  }

  const config = loadConfig(docsRoot);
  return getNestedValue(config, dotPath);
}

/**
 * Set a config value by dot-notation key.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {string} dotPath - Dot-notation key
 * @param {*} value - Value to set
 */
function set(docsRoot, dotPath, value) {
  if (typeof docsRoot !== 'string' && Array.isArray(docsRoot)) {
    // Called from CLI: args = [dotPath, value]
    const args = docsRoot;
    const projectRoot = process.cwd();
    const planningRoot = path.join(projectRoot, '.planning');
    const key = args[0];
    const val = parseCliValue(args[1]);
    set(planningRoot, key, val);
    process.stdout.write(JSON.stringify({ ok: true, key, value: val }));
    return;
  }

  const configPath = path.join(docsRoot, CONFIG_FILE);
  let config = {};

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (_) {
    // Start with empty config
  }

  setNestedValue(config, dotPath, value);
  ensureDir(docsRoot);
  atomicWrite(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Initialize a fresh config.json with optional overrides.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {object} [overrides={}] - Initial overrides
 */
function initConfig(docsRoot, overrides = {}) {
  ensureDir(docsRoot);
  const configPath = path.join(docsRoot, CONFIG_FILE);

  if (fs.existsSync(configPath)) {
    // Don't overwrite existing config
    return loadConfig(docsRoot);
  }

  const config = deepMerge({}, overrides);
  atomicWrite(configPath, JSON.stringify(config, null, 2) + '\n');
  return loadConfig(docsRoot);
}

// --- Utility functions ---

function getNestedValue(obj, dotPath) {
  if (!dotPath) return obj;
  const keys = dotPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function setNestedValue(obj, dotPath, value) {
  const keys = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function parseCliValue(str) {
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (str === 'null') return null;
  if (!isNaN(Number(str)) && str !== '') return Number(str);
  return str;
}

module.exports = {
  DEFAULTS,
  loadConfig,
  get,
  set,
  initConfig,
};
