/**
 * GTD File Operations — Atomic writes, directory utilities, project root detection.
 * @module lib/file-ops
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Write content to a file atomically.
 * Writes to a temp file first, then renames (atomic on same filesystem).
 * Prevents corruption if the process crashes mid-write.
 *
 * @param {string} targetPath - Absolute path to write to
 * @param {string} content - File content
 */
function atomicWrite(targetPath, content) {
  const tmpPath = targetPath + '.tmp.' + process.pid;
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch (_) {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/**
 * Ensure a directory exists (recursive mkdir).
 * @param {string} dirPath - Directory path to create
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Find the project root by walking up the directory tree.
 * Looks for: .planning/, .git/, package.json
 *
 * @param {string} [startDir=process.cwd()] - Starting directory
 * @returns {string|null} Project root path or null
 */
function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, '.planning')) ||
      fs.existsSync(path.join(dir, '.git')) ||
      fs.existsSync(path.join(dir, 'package.json'))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return null;
}

/**
 * Check if a file exists.
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_) {
    return false;
  }
}

/**
 * Read a file, returning a default value if it doesn't exist.
 * @param {string} filePath - Path to read
 * @param {string} defaultValue - Default if file missing
 * @returns {string}
 */
function readFileOr(filePath, defaultValue) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return defaultValue;
  }
}

module.exports = {
  atomicWrite,
  ensureDir,
  findProjectRoot,
  fileExists,
  readFileOr,
};
