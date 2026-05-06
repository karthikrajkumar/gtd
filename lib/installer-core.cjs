/**
 * GTD Installer Core — Shared logic for all runtime installers.
 *
 * Handles: file discovery, copy, config generation, health check.
 * Runtime-specific adapters call these functions.
 *
 * @module lib/installer-core
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ensureDir, atomicWrite } = require('./file-ops.cjs');

/**
 * Source directory — where the GTD framework files live in the npm package.
 */
const PACKAGE_ROOT = path.resolve(__dirname, '..');

/**
 * Directories to install.
 */
const INSTALL_DIRS = [
  'agents/forward',
  'agents/backward',
  'agents/sync',
  'agents/utility',
  'commands/gtd/forward',
  'commands/gtd/backward',
  'commands/gtd/sync',
  'commands/gtd/utility',
  'commands/gtd/session',
  'workflows/forward',
  'workflows/backward',
  'workflows/sync',
  'workflows/session',
  'references',
  'templates/forward',
  'templates/forward/research',
  'templates/backward/tdd',
  'templates/backward/hld',
  'templates/backward/lld',
  'templates/backward/capacity',
  'templates/backward/system-design',
  'templates/backward/api-docs',
  'templates/backward/runbook',
  'templates/backward/formats',
  'contexts',
  'hooks',
  'lib',
];

/**
 * Files to always install (relative to package root).
 */
const INSTALL_FILES = [
  'bin/gtd-tools.cjs',
];

/**
 * Copy framework files to the install destination.
 *
 * @param {string} destBase - Destination base directory (e.g., ~/.claude/get-things-done/)
 * @param {object} [options={}] - { verbose: boolean }
 * @returns {{ copied: number, errors: string[] }}
 */
function copyFrameworkFiles(destBase, options = {}) {
  let copied = 0;
  const errors = [];

  // Copy bin/gtd-tools.cjs
  for (const file of INSTALL_FILES) {
    const src = path.join(PACKAGE_ROOT, file);
    const dest = path.join(destBase, file);
    try {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      copied++;
      if (options.verbose) console.log(`  Copied: ${file}`);
    } catch (err) {
      errors.push(`Failed to copy ${file}: ${err.message}`);
    }
  }

  // Copy directories
  for (const dir of INSTALL_DIRS) {
    const srcDir = path.join(PACKAGE_ROOT, dir);
    if (!fs.existsSync(srcDir)) continue;

    const destDir = path.join(destBase, dir);
    ensureDir(destDir);

    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.md') || f.endsWith('.cjs'));
    for (const file of files) {
      try {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        copied++;
        if (options.verbose) console.log(`  Copied: ${dir}/${file}`);
      } catch (err) {
        errors.push(`Failed to copy ${dir}/${file}: ${err.message}`);
      }
    }
  }

  return { copied, errors };
}

/**
 * Generate initial config.json at the install location.
 *
 * @param {string} destBase - Destination base directory
 * @param {object} [overrides={}] - User-selected overrides (format, etc.)
 */
function generateConfig(destBase, overrides = {}) {
  const configDir = path.join(destBase, '..', '.planning');
  // Don't overwrite existing config
  const configPath = path.join(configDir, 'config.json');
  if (fs.existsSync(configPath)) return;

  // Only create if user is doing local install (project-level)
  // Global installs don't create .planning/ — that's per-project
}

/**
 * Verify installation by checking key files exist.
 *
 * @param {string} destBase - Installation directory
 * @returns {{ ok: boolean, missing: string[], found: number }}
 */
function verifyInstallation(destBase) {
  const critical = [
    'bin/gtd-tools.cjs',
    'agents/backward/gtd-codebase-mapper.md',
    'agents/backward/gtd-tdd-writer.md',
    'agents/forward/gtd-executor.md',
    'agents/sync/gtd-drift-detector.md',
    'workflows/backward/scan-codebase.md',
    'workflows/forward/new-project.md',
    'workflows/sync/detect-drift.md',
    'references/framework-signatures.md',
    'templates/backward/tdd/standard.md',
  ];

  const missing = critical.filter((f) => !fs.existsSync(path.join(destBase, f)));
  return {
    ok: missing.length === 0,
    missing,
    found: critical.length - missing.length,
    total: critical.length,
  };
}

/**
 * Get the installed version from a destination directory.
 *
 * @param {string} destBase - Installation directory
 * @returns {string|null} Version string or null
 */
function getInstalledVersion(destBase) {
  try {
    const versionFile = path.join(destBase, '.gtd-version');
    if (fs.existsSync(versionFile)) {
      return fs.readFileSync(versionFile, 'utf8').trim();
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Write version marker after successful install.
 *
 * @param {string} destBase - Installation directory
 * @param {string} version - Version string
 */
function writeVersionMarker(destBase, version) {
  atomicWrite(path.join(destBase, '.gtd-version'), version + '\n');
}

/**
 * Remove installed files (uninstall).
 *
 * @param {string} destBase - Installation directory
 * @returns {{ removed: number }}
 */
function removeInstallation(destBase) {
  let removed = 0;
  if (fs.existsSync(destBase)) {
    fs.rmSync(destBase, { recursive: true, force: true });
    removed = 1;
  }
  return { removed };
}

module.exports = {
  PACKAGE_ROOT,
  INSTALL_DIRS,
  INSTALL_FILES,
  copyFrameworkFiles,
  generateConfig,
  verifyInstallation,
  getInstalledVersion,
  writeVersionMarker,
  removeInstallation,
};
