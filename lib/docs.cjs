/**
 * GTD Document Management — List, status, version, finalize documents.
 *
 * Manages the document lifecycle: draft → review → finalized
 * Tracks versions in history/ directory.
 *
 * @module lib/docs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWrite, ensureDir, fileExists } = require('./file-ops.cjs');
const { parseFrontmatter } = require('./frontmatter.cjs');
const { updateDocumentStatus } = require('./state.cjs');

/**
 * All recognized document types.
 */
const DOCUMENT_TYPES = [
  'tdd',
  'hld',
  'lld',
  'capacity',
  'system-design',
  'api-docs',
  'runbook',
];

/**
 * Mapping of document type to output filename.
 */
const DOC_FILENAMES = {
  tdd: 'TDD',
  hld: 'HLD',
  lld: 'LLD',
  capacity: 'CAPACITY-PLAN',
  'system-design': 'SYSTEM-DESIGN',
  'api-docs': 'API-DOCS',
  runbook: 'RUNBOOK',
};

/**
 * Get the file path for a document.
 *
 * @param {string} docsRoot - .planning/ directory
 * @param {string} docType - Document type
 * @param {boolean} [draft=false] - If true, return draft path
 * @returns {string} Absolute file path
 */
function getDocumentPath(docsRoot, docType, draft = false) {
  const filename = DOC_FILENAMES[docType] || docType.toUpperCase();
  if (draft) {
    return path.join(docsRoot, 'drafts', `${filename}-DRAFT.md`);
  }
  return path.join(docsRoot, 'documents', `${filename}.md`);
}

/**
 * List all documents with their current status.
 *
 * @param {string} docsRoot - .planning/ directory
 * @returns {Array<{type: string, status: string, version: string|null, path: string|null, draftPath: string|null}>}
 */
function listDocuments(docsRoot) {
  return DOCUMENT_TYPES.map((type) => {
    const finalPath = getDocumentPath(docsRoot, type, false);
    const draftPath = getDocumentPath(docsRoot, type, true);
    const hasFinal = fileExists(finalPath);
    const hasDraft = fileExists(draftPath);

    let status = 'pending';
    let version = null;
    let commit = null;

    if (hasFinal) {
      const content = fs.readFileSync(finalPath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      version = frontmatter.version || '1.0';
      commit = frontmatter.commit || null;
      status = 'finalized';
    } else if (hasDraft) {
      status = 'drafting';
    }

    return {
      type,
      status,
      version,
      commit,
      finalPath: hasFinal ? finalPath : null,
      draftPath: hasDraft ? draftPath : null,
      filename: DOC_FILENAMES[type],
    };
  });
}

/**
 * Move a draft document to its final location.
 *
 * @param {string} docsRoot - .planning/ directory
 * @param {string} docType - Document type
 * @returns {{ success: boolean, finalPath: string }}
 */
function finalize(docsRoot, docType) {
  const draftPath = getDocumentPath(docsRoot, docType, true);
  const finalPath = getDocumentPath(docsRoot, docType, false);

  if (!fileExists(draftPath)) {
    throw new Error(`No draft found for ${docType} at ${draftPath}`);
  }

  ensureDir(path.dirname(finalPath));
  const content = fs.readFileSync(draftPath, 'utf8');
  atomicWrite(finalPath, content);

  // Remove draft
  try {
    fs.unlinkSync(draftPath);
  } catch (_) {}

  // Update state
  updateDocumentStatus(docsRoot, docType, {
    status: 'finalized',
    version: extractVersion(content) || '1.0',
    commit: extractCommit(content),
  });

  return { success: true, finalPath };
}

/**
 * Archive the current document version to history/ before overwriting.
 *
 * @param {string} docsRoot - .planning/ directory
 * @param {string} docType - Document type
 * @returns {{ archived: boolean, archivePath: string|null }}
 */
function archiveVersion(docsRoot, docType) {
  const finalPath = getDocumentPath(docsRoot, docType, false);

  if (!fileExists(finalPath)) {
    return { archived: false, archivePath: null };
  }

  const content = fs.readFileSync(finalPath, 'utf8');
  const { frontmatter } = parseFrontmatter(content);
  const version = frontmatter.version || '1.0';
  const commit = frontmatter.commit || 'unknown';
  const date = new Date().toISOString().split('T')[0];

  const historyDir = path.join(docsRoot, 'history', DOC_FILENAMES[docType] || docType.toUpperCase());
  ensureDir(historyDir);

  const archiveName = `v${version}_${commit}_${date}.md`;
  const archivePath = path.join(historyDir, archiveName);
  atomicWrite(archivePath, content);

  return { archived: true, archivePath };
}

/**
 * Get metadata from a document file.
 *
 * @param {string} docsRoot - .planning/ directory
 * @param {string} docType - Document type
 * @returns {object|null} Frontmatter metadata or null
 */
function getDocumentMetadata(docsRoot, docType) {
  const finalPath = getDocumentPath(docsRoot, docType, false);
  const draftPath = getDocumentPath(docsRoot, docType, true);

  const filePath = fileExists(finalPath) ? finalPath : fileExists(draftPath) ? draftPath : null;
  if (!filePath) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const { frontmatter } = parseFrontmatter(content);
  return {
    ...frontmatter,
    path: filePath,
    isDraft: filePath === draftPath,
  };
}

/**
 * Bump the version number of a document.
 *
 * @param {string} currentVersion - Current version string (e.g., "1.0")
 * @param {'major'|'minor'} [bump='minor'] - Bump type
 * @returns {string} New version string
 */
function bumpVersion(currentVersion, bump = 'minor') {
  if (!currentVersion) return '1.0';
  const parts = currentVersion.split('.').map(Number);
  if (bump === 'major') {
    return `${parts[0] + 1}.0`;
  }
  return `${parts[0]}.${(parts[1] || 0) + 1}`;
}

// --- Internal helpers ---

function extractVersion(content) {
  const match = content.match(/\*\*Version:\*\*\s*(\S+)/);
  return match ? match[1] : null;
}

function extractCommit(content) {
  const match = content.match(/\*\*Commit:\*\*\s*(\S+)/);
  return match ? match[1] : null;
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'list';

  if (subcommand === 'list') {
    process.stdout.write(JSON.stringify(listDocuments(docsRoot), null, 2));
  } else if (subcommand === 'status' && args[1]) {
    const meta = getDocumentMetadata(docsRoot, args[1]);
    process.stdout.write(JSON.stringify(meta, null, 2));
  } else if (subcommand === 'finalize' && args[1]) {
    const result = finalize(docsRoot, args[1]);
    process.stdout.write(JSON.stringify(result, null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs doc <list|status|finalize> [type]\n');
    process.exit(1);
  }
}

module.exports = {
  DOCUMENT_TYPES,
  DOC_FILENAMES,
  getDocumentPath,
  listDocuments,
  finalize,
  archiveVersion,
  getDocumentMetadata,
  bumpVersion,
  run,
};
