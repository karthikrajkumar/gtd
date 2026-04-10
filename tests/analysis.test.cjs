/**
 * Tests for lib/analysis.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTempPlanningDir, mockGitCommit, writePlanningFile } = require('./helpers.cjs');
const {
  DIMENSIONS,
  getAnalysisStatus,
  isStale,
  getStaleDimensions,
  getCodebaseMapStatus,
  getRequiredDimensions,
} = require('../lib/analysis.cjs');

let temp;

beforeEach(() => {
  temp = createTempPlanningDir();
});

afterEach(() => {
  temp.cleanup();
});

describe('DIMENSIONS', () => {
  it('has 6 analysis dimensions', () => {
    expect(DIMENSIONS).toHaveLength(6);
    expect(DIMENSIONS).toContain('architecture');
    expect(DIMENSIONS).toContain('api');
    expect(DIMENSIONS).toContain('data-flow');
    expect(DIMENSIONS).toContain('dependencies');
    expect(DIMENSIONS).toContain('security');
    expect(DIMENSIONS).toContain('performance');
  });
});

describe('getAnalysisStatus', () => {
  it('returns all missing when no analysis directory', () => {
    const status = getAnalysisStatus(temp.dir);
    expect(status.complete).toBe(false);
    expect(status.current).toBe(0);
    expect(status.total).toBe(6);
    for (const dim of DIMENSIONS) {
      expect(status.dimensions[dim].status).toBe('missing');
    }
  });

  it('detects completed analysis files', () => {
    const commit = mockGitCommit();
    writePlanningFile(temp.dir, 'analysis/ARCHITECTURE-ANALYSIS.md',
      `---\ndimension: architecture\ncommit: ${commit}\ntimestamp: 2026-04-10T10:00:00Z\nfiles_analyzed: 50\n---\n# Architecture Analysis\n...`
    );

    const status = getAnalysisStatus(temp.dir);
    expect(status.dimensions.architecture.status).toBe('complete');
    expect(status.dimensions.architecture.commit).toBe(commit);
    expect(status.dimensions.architecture.files_analyzed).toBe(50);
  });
});

describe('getCodebaseMapStatus', () => {
  it('returns exists:false when no CODEBASE-MAP.md', () => {
    const status = getCodebaseMapStatus(temp.dir);
    expect(status.exists).toBe(false);
    expect(status.stale).toBe(true);
  });

  it('returns exists:true when CODEBASE-MAP.md present', () => {
    const commit = mockGitCommit();
    writePlanningFile(temp.dir, 'CODEBASE-MAP.md',
      `---\ncommit: ${commit}\ntimestamp: 2026-04-10\n---\n# Codebase Map\n...`
    );

    const status = getCodebaseMapStatus(temp.dir);
    expect(status.exists).toBe(true);
    expect(status.commit).toBe(commit);
  });
});

describe('getRequiredDimensions', () => {
  it('returns correct dimensions for TDD', () => {
    const dims = getRequiredDimensions('tdd');
    expect(dims).toContain('architecture');
    expect(dims).toContain('dependencies');
  });

  it('returns all dimensions for system-design', () => {
    const dims = getRequiredDimensions('system-design');
    expect(dims).toHaveLength(6);
  });

  it('returns minimal dimensions for api-docs', () => {
    const dims = getRequiredDimensions('api-docs');
    expect(dims).toContain('api');
    expect(dims.length).toBeLessThan(6);
  });

  it('returns all dimensions for unknown doc type', () => {
    const dims = getRequiredDimensions('unknown-type');
    expect(dims).toEqual(DIMENSIONS);
  });
});

describe('getStaleDimensions', () => {
  it('returns all dimensions when nothing analyzed', () => {
    const stale = getStaleDimensions(temp.dir);
    expect(stale).toHaveLength(6);
  });
});

describe('isStale', () => {
  it('returns true for missing dimension', () => {
    expect(isStale(temp.dir, 'architecture')).toBe(true);
  });
});
