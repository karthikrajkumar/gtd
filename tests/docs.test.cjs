/**
 * Tests for lib/docs.cjs — Document management
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTempPlanningDir, writePlanningFile, mockGitCommit } = require('./helpers.cjs');
const {
  DOCUMENT_TYPES,
  DOC_FILENAMES,
  getDocumentPath,
  listDocuments,
  finalize,
  archiveVersion,
  getDocumentMetadata,
  bumpVersion,
} = require('../lib/docs.cjs');

let temp;

beforeEach(() => {
  temp = createTempPlanningDir();
});

afterEach(() => {
  temp.cleanup();
});

describe('DOCUMENT_TYPES', () => {
  it('has 7 document types', () => {
    expect(DOCUMENT_TYPES).toHaveLength(7);
    expect(DOCUMENT_TYPES).toContain('tdd');
    expect(DOCUMENT_TYPES).toContain('hld');
    expect(DOCUMENT_TYPES).toContain('lld');
    expect(DOCUMENT_TYPES).toContain('capacity');
    expect(DOCUMENT_TYPES).toContain('system-design');
    expect(DOCUMENT_TYPES).toContain('api-docs');
    expect(DOCUMENT_TYPES).toContain('runbook');
  });
});

describe('DOC_FILENAMES', () => {
  it('maps all types to filenames', () => {
    expect(DOC_FILENAMES.tdd).toBe('TDD');
    expect(DOC_FILENAMES.hld).toBe('HLD');
    expect(DOC_FILENAMES['system-design']).toBe('SYSTEM-DESIGN');
    expect(DOC_FILENAMES['api-docs']).toBe('API-DOCS');
  });
});

describe('getDocumentPath', () => {
  it('returns final path', () => {
    const p = getDocumentPath(temp.dir, 'tdd');
    expect(p).toContain('documents');
    expect(p).toContain('TDD.md');
  });

  it('returns draft path', () => {
    const p = getDocumentPath(temp.dir, 'tdd', true);
    expect(p).toContain('drafts');
    expect(p).toContain('TDD-DRAFT.md');
  });
});

describe('listDocuments', () => {
  it('returns all 7 types as pending when nothing exists', () => {
    const docs = listDocuments(temp.dir);
    expect(docs).toHaveLength(7);
    for (const doc of docs) {
      expect(doc.status).toBe('pending');
    }
  });

  it('detects drafting status', () => {
    writePlanningFile(temp.dir, 'drafts/TDD-DRAFT.md', '# Draft TDD');
    const docs = listDocuments(temp.dir);
    const tdd = docs.find((d) => d.type === 'tdd');
    expect(tdd.status).toBe('drafting');
  });

  it('detects finalized status with version', () => {
    writePlanningFile(temp.dir, 'documents/TDD.md',
      '---\nversion: 1.0\ncommit: abc1234\n---\n# TDD');
    const docs = listDocuments(temp.dir);
    const tdd = docs.find((d) => d.type === 'tdd');
    expect(tdd.status).toBe('finalized');
    // YAML parser returns version 1.0 as number 1 — convert to string for comparison
    expect(String(tdd.version)).toMatch(/^1(\.0)?$/);
  });

  it('tracks each document independently', () => {
    writePlanningFile(temp.dir, 'documents/TDD.md', '---\nversion: 1.0\n---\n# TDD');
    writePlanningFile(temp.dir, 'drafts/HLD-DRAFT.md', '# Draft HLD');
    const docs = listDocuments(temp.dir);
    expect(docs.find((d) => d.type === 'tdd').status).toBe('finalized');
    expect(docs.find((d) => d.type === 'hld').status).toBe('drafting');
    expect(docs.find((d) => d.type === 'lld').status).toBe('pending');
  });
});

describe('finalize', () => {
  it('moves draft to documents directory', () => {
    writePlanningFile(temp.dir, 'drafts/TDD-DRAFT.md',
      '---\nversion: 1.0\ncommit: abc1234\n---\n# TDD\n**Version:** 1.0\n**Commit:** abc1234');
    const result = finalize(temp.dir, 'tdd');
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.finalPath)).toBe(true);
    expect(fs.existsSync(getDocumentPath(temp.dir, 'tdd', true))).toBe(false); // Draft removed
  });

  it('throws when no draft exists', () => {
    expect(() => finalize(temp.dir, 'tdd')).toThrow(/No draft found/);
  });
});

describe('archiveVersion', () => {
  it('archives existing document to history/', () => {
    writePlanningFile(temp.dir, 'documents/TDD.md',
      '---\nversion: 1.0\ncommit: abc1234\n---\n# TDD');
    const result = archiveVersion(temp.dir, 'tdd');
    expect(result.archived).toBe(true);
    expect(fs.existsSync(result.archivePath)).toBe(true);
    expect(result.archivePath).toContain('history/TDD');
  });

  it('returns archived:false when no document exists', () => {
    const result = archiveVersion(temp.dir, 'tdd');
    expect(result.archived).toBe(false);
  });
});

describe('getDocumentMetadata', () => {
  it('returns metadata from finalized document', () => {
    writePlanningFile(temp.dir, 'documents/HLD.md',
      '---\nversion: 2.1\ncommit: def5678\n---\n# HLD');
    const meta = getDocumentMetadata(temp.dir, 'hld');
    // YAML parser may return 2.1 as number — compare loosely
    expect(Number(meta.version)).toBe(2.1);
    expect(meta.isDraft).toBe(false);
  });

  it('returns metadata from draft', () => {
    writePlanningFile(temp.dir, 'drafts/LLD-DRAFT.md',
      '---\nversion: 0.1\n---\n# LLD Draft');
    const meta = getDocumentMetadata(temp.dir, 'lld');
    expect(meta.isDraft).toBe(true);
  });

  it('returns null for nonexistent document', () => {
    expect(getDocumentMetadata(temp.dir, 'capacity')).toBeNull();
  });
});

describe('bumpVersion', () => {
  it('bumps minor version', () => {
    expect(bumpVersion('1.0')).toBe('1.1');
    expect(bumpVersion('1.5')).toBe('1.6');
    expect(bumpVersion('2.3')).toBe('2.4');
  });

  it('bumps major version', () => {
    expect(bumpVersion('1.5', 'major')).toBe('2.0');
    expect(bumpVersion('3.2', 'major')).toBe('4.0');
  });

  it('handles null/undefined', () => {
    expect(bumpVersion(null)).toBe('1.0');
    expect(bumpVersion(undefined)).toBe('1.0');
  });
});
