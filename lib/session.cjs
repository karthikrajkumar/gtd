'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot, atomicWrite } = require('./file-ops.cjs');

const HANDOFF_FILENAME = 'HANDOFF.json';
const HANDOFF_VERSION = '1.0';

function getHandoffPath(docsRoot) {
  return path.join(docsRoot, HANDOFF_FILENAME);
}

function createHandoff(docsRoot, sessionData) {
  const handoff = {
    version: HANDOFF_VERSION,
    timestamp: new Date().toISOString(),
    phase: sessionData.phase || null,
    step: sessionData.step || null,
    plan_index: sessionData.plan_index || null,
    decisions: sessionData.decisions || [],
    blockers: sessionData.blockers || [],
    context_summary: sessionData.context_summary || '',
    files_modified_this_session: sessionData.files_modified || [],
    next_action: sessionData.next_action || '',
    git_branch: sessionData.git_branch || null,
    git_commit: sessionData.git_commit || null,
  };

  const handoffPath = getHandoffPath(docsRoot);
  atomicWrite(handoffPath, JSON.stringify(handoff, null, 2));
  return handoff;
}

function loadHandoff(docsRoot) {
  const handoffPath = getHandoffPath(docsRoot);

  if (!fs.existsSync(handoffPath)) {
    return null;
  }

  const raw = fs.readFileSync(handoffPath, 'utf8');
  const handoff = JSON.parse(raw);

  if (!handoff.version || !handoff.timestamp) {
    throw new Error('Invalid HANDOFF.json: missing required fields');
  }

  return handoff;
}

function hasHandoff(docsRoot) {
  return fs.existsSync(getHandoffPath(docsRoot));
}

function archiveHandoff(docsRoot) {
  const handoffPath = getHandoffPath(docsRoot);
  if (!fs.existsSync(handoffPath)) return false;

  const archiveDir = path.join(docsRoot, 'session-history');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const handoff = loadHandoff(docsRoot);
  const timestamp = handoff.timestamp.replace(/[:.]/g, '-').slice(0, 19);
  const archivePath = path.join(archiveDir, `HANDOFF-${timestamp}.json`);
  fs.renameSync(handoffPath, archivePath);
  return archivePath;
}

function generateSessionReport(docsRoot, handoff) {
  if (!handoff) handoff = loadHandoff(docsRoot);
  if (!handoff) return null;

  const lines = [
    '# Session Report',
    '',
    `**Date:** ${handoff.timestamp}`,
    `**Phase:** ${handoff.phase || 'N/A'}`,
    `**Step:** ${handoff.step || 'N/A'}`,
    '',
    '## Context Summary',
    '',
    handoff.context_summary || '_No summary provided._',
    '',
    '## Decisions Made',
    '',
  ];

  if (handoff.decisions.length > 0) {
    handoff.decisions.forEach((d, i) => {
      lines.push(`${i + 1}. ${d}`);
    });
  } else {
    lines.push('_None recorded._');
  }

  lines.push('', '## Files Modified', '');

  if (handoff.files_modified_this_session.length > 0) {
    handoff.files_modified_this_session.forEach((f) => {
      lines.push(`- \`${f}\``);
    });
  } else {
    lines.push('_None recorded._');
  }

  if (handoff.blockers.length > 0) {
    lines.push('', '## Blockers', '');
    handoff.blockers.forEach((b, i) => {
      lines.push(`${i + 1}. ${b}`);
    });
  }

  lines.push('', '## Next Action', '', handoff.next_action || '_Not specified._');

  return lines.join('\n');
}

module.exports = {
  HANDOFF_FILENAME,
  getHandoffPath,
  createHandoff,
  loadHandoff,
  hasHandoff,
  archiveHandoff,
  generateSessionReport,
};
