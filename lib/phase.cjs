/**
 * GTD Phase Management — Phase directories, decimal numbering, plan indexing, wave grouping.
 * @module lib/phase
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ensureDir, fileExists } = require('./file-ops.cjs');
const { parseFrontmatter } = require('./frontmatter.cjs');

/**
 * Get the zero-padded phase directory name.
 * @param {number} phaseNumber - Phase number
 * @param {string} phaseName - Phase name/slug
 * @returns {string} e.g., "01-authentication"
 */
function phaseDir(phaseNumber, phaseName) {
  const padded = String(phaseNumber).padStart(2, '0');
  const slug = phaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${padded}-${slug}`;
}

/**
 * List all phase directories in .planning/phases/.
 * @param {string} docsRoot - .planning/ directory
 * @returns {Array<{number: number, name: string, dir: string, path: string}>}
 */
function listPhases(docsRoot) {
  const phasesDir = path.join(docsRoot, 'phases');
  if (!fs.existsSync(phasesDir)) return [];

  return fs.readdirSync(phasesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
    .map((d) => {
      const num = parseInt(d.name.slice(0, 2), 10);
      const name = d.name.slice(3);
      return {
        number: num,
        name,
        dir: d.name,
        path: path.join(phasesDir, d.name),
      };
    })
    .sort((a, b) => a.number - b.number);
}

/**
 * Get a specific phase by number.
 * @param {string} docsRoot - .planning/ directory
 * @param {number} phaseNumber - Phase number
 * @returns {object|null} Phase info or null
 */
function getPhase(docsRoot, phaseNumber) {
  const phases = listPhases(docsRoot);
  return phases.find((p) => p.number === phaseNumber) || null;
}

/**
 * Create a new phase directory with standard structure.
 * @param {string} docsRoot - .planning/ directory
 * @param {number} phaseNumber - Phase number
 * @param {string} phaseName - Phase name
 * @returns {string} Phase directory path
 */
function createPhase(docsRoot, phaseNumber, phaseName) {
  const dirName = phaseDir(phaseNumber, phaseName);
  const fullPath = path.join(docsRoot, 'phases', dirName);
  ensureDir(fullPath);
  return fullPath;
}

/**
 * List all plan files in a phase directory.
 * Plans follow the pattern: {phase}-{plan_num}-PLAN.md
 * @param {string} phasePath - Full path to phase directory
 * @returns {Array<{filename: string, path: string, number: number, name: string}>}
 */
function listPlans(phasePath) {
  if (!fs.existsSync(phasePath)) return [];

  return fs.readdirSync(phasePath)
    .filter((f) => f.includes('-PLAN') && f.endsWith('.md'))
    .map((f) => {
      const match = f.match(/(\d+)-(\d+)-(.+)-PLAN\.md/);
      return {
        filename: f,
        path: path.join(phasePath, f),
        number: match ? parseInt(match[2], 10) : 0,
        name: match ? match[3] : f,
      };
    })
    .sort((a, b) => a.number - b.number);
}

/**
 * List all SUMMARY.md files in a phase (produced by executor agents).
 * @param {string} phasePath - Full path to phase directory
 * @returns {string[]} Summary file paths
 */
function listSummaries(phasePath) {
  if (!fs.existsSync(phasePath)) return [];
  return fs.readdirSync(phasePath)
    .filter((f) => f.includes('SUMMARY') && f.endsWith('.md'))
    .map((f) => path.join(phasePath, f));
}

/**
 * Group plans into execution waves based on dependencies.
 * Plans with no dependencies go in wave 1. Plans depending on wave 1 go in wave 2, etc.
 *
 * @param {Array} plans - Plan list from listPlans()
 * @param {object} [dependencies={}] - Map of plan name → dependency plan names
 * @returns {Array<Array>} Waves of plans
 */
function groupIntoWaves(plans, dependencies = {}) {
  if (plans.length === 0) return [];

  const completed = new Set();
  const waves = [];
  let remaining = [...plans];

  while (remaining.length > 0) {
    const wave = remaining.filter((plan) => {
      const deps = dependencies[plan.name] || [];
      return deps.every((dep) => completed.has(dep));
    });

    if (wave.length === 0) {
      // Circular dependency — put remaining in last wave
      waves.push(remaining);
      break;
    }

    waves.push(wave);
    for (const plan of wave) {
      completed.add(plan.name);
    }
    remaining = remaining.filter((p) => !completed.has(p.name));
  }

  return waves;
}

/**
 * Get phase progress (plans completed vs total).
 * @param {string} phasePath - Full path to phase directory
 * @returns {{ total: number, completed: number, percentage: number }}
 */
function getPhaseProgress(phasePath) {
  const plans = listPlans(phasePath);
  const summaries = listSummaries(phasePath);
  const total = plans.length;
  const completed = summaries.length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'list';

  if (subcommand === 'list') {
    process.stdout.write(JSON.stringify(listPhases(docsRoot), null, 2));
  } else if (subcommand === 'get' && args[1]) {
    const phase = getPhase(docsRoot, parseInt(args[1], 10));
    process.stdout.write(JSON.stringify(phase, null, 2));
  } else if (subcommand === 'plans' && args[1]) {
    const phase = getPhase(docsRoot, parseInt(args[1], 10));
    if (phase) {
      process.stdout.write(JSON.stringify(listPlans(phase.path), null, 2));
    } else {
      process.stdout.write('[]');
    }
  } else if (subcommand === 'progress' && args[1]) {
    const phase = getPhase(docsRoot, parseInt(args[1], 10));
    if (phase) {
      process.stdout.write(JSON.stringify(getPhaseProgress(phase.path), null, 2));
    } else {
      process.stdout.write(JSON.stringify({ total: 0, completed: 0, percentage: 0 }));
    }
  } else {
    process.stderr.write('Usage: gtd-tools.cjs phase <list|get|plans|progress> [number]\n');
    process.exit(1);
  }
}

module.exports = {
  phaseDir,
  listPhases,
  getPhase,
  createPhase,
  listPlans,
  listSummaries,
  groupIntoWaves,
  getPhaseProgress,
  run,
};
