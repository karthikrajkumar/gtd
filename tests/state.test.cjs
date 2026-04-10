/**
 * Tests for lib/state.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTempPlanningDir } = require('./helpers.cjs');
const {
  defaultState,
  loadState,
  updateState,
  transition,
  getDocumentStatus,
  updateDocumentStatus,
  getPipelineStatus,
  FORWARD_TRANSITIONS,
  BACKWARD_TRANSITIONS,
  SYNC_TRANSITIONS,
} = require('../lib/state.cjs');

let temp;

beforeEach(() => {
  temp = createTempPlanningDir();
});

afterEach(() => {
  temp.cleanup();
});

describe('defaultState', () => {
  it('has bidirectional mode', () => {
    const state = defaultState();
    expect(state.mode).toBe('bidirectional');
  });

  it('has all three pipelines', () => {
    const state = defaultState();
    expect(state).toHaveProperty('forward');
    expect(state).toHaveProperty('backward');
    expect(state).toHaveProperty('sync');
    expect(state).toHaveProperty('metrics');
  });

  it('starts with empty forward status', () => {
    const state = defaultState();
    expect(state.forward.status).toBe('empty');
    expect(state.forward.current_phase).toBeNull();
  });

  it('starts with empty backward status', () => {
    const state = defaultState();
    expect(state.backward.status).toBe('empty');
    expect(state.backward.documents).toEqual({});
  });

  it('starts with synced sync status', () => {
    const state = defaultState();
    expect(state.sync.status).toBe('synced');
  });

  it('starts with zero metrics', () => {
    const state = defaultState();
    expect(state.metrics.total_tokens).toBe(0);
    expect(state.metrics.total_cost_usd).toBe(0);
    expect(state.metrics.agents_spawned).toBe(0);
  });
});

describe('loadState', () => {
  it('returns default state when no STATE.md exists', () => {
    const state = loadState(temp.dir);
    expect(state.mode).toBe('bidirectional');
    expect(state.forward.status).toBe('empty');
  });

  it('loads state from existing STATE.md', () => {
    updateState(temp.dir, { forward: { status: 'planned', current_phase: 3 } });
    const state = loadState(temp.dir);
    expect(state.forward.status).toBe('planned');
    expect(state.forward.current_phase).toBe(3);
  });
});

describe('updateState', () => {
  it('merges partial updates into existing state', () => {
    updateState(temp.dir, { forward: { status: 'researched' } });
    const state = loadState(temp.dir);
    expect(state.forward.status).toBe('researched');
    // Other fields preserved
    expect(state.backward.status).toBe('empty');
    expect(state.sync.status).toBe('synced');
  });

  it('handles deep merges for backward documents', () => {
    updateState(temp.dir, {
      backward: {
        status: 'analyzed',
        documents: { tdd: { status: 'drafting', version: null } },
      },
    });
    const state = loadState(temp.dir);
    expect(state.backward.status).toBe('analyzed');
    expect(state.backward.documents.tdd.status).toBe('drafting');
  });

  it('updates metrics additively', () => {
    updateState(temp.dir, { metrics: { total_tokens: 50000, total_cost_usd: 1.5 } });
    const state = loadState(temp.dir);
    expect(state.metrics.total_tokens).toBe(50000);
    expect(state.metrics.total_cost_usd).toBe(1.5);
  });

  it('produces human-readable STATE.md', () => {
    updateState(temp.dir, { forward: { status: 'executing', current_phase: 2 } });
    const content = fs.readFileSync(path.join(temp.dir, 'STATE.md'), 'utf8');
    expect(content).toContain('# GTD State');
    expect(content).toContain('**Status:** executing');
    expect(content).toContain('**Current Phase:** 2');
    expect(content).toContain('## Documents');
    expect(content).toContain('## Sync');
  });

  it('round-trips correctly (load → update → load)', () => {
    updateState(temp.dir, {
      forward: { status: 'planned', current_phase: 5, current_milestone: 'v1.0' },
      backward: { status: 'finalized', last_scan_commit: 'abc1234' },
      sync: { status: 'drifted', drift_items: 3 },
    });
    const state = loadState(temp.dir);
    expect(state.forward.status).toBe('planned');
    expect(state.forward.current_phase).toBe(5);
    expect(state.forward.current_milestone).toBe('v1.0');
    expect(state.backward.status).toBe('finalized');
    expect(state.backward.last_scan_commit).toBe('abc1234');
    expect(state.sync.status).toBe('drifted');
    expect(state.sync.drift_items).toBe(3);
  });
});

describe('transition', () => {
  // Forward transitions
  it('validates: empty → researched (forward)', () => {
    expect(transition('forward', 'empty', 'researched')).toBe(true);
  });

  it('validates: planned → executing (forward)', () => {
    expect(transition('forward', 'planned', 'executing')).toBe(true);
  });

  it('rejects: empty → executing (forward)', () => {
    expect(() => transition('forward', 'empty', 'executing')).toThrow(/Invalid forward transition/);
  });

  it('rejects: empty → drafting (forward)', () => {
    expect(() => transition('forward', 'empty', 'drafting')).toThrow();
  });

  // Backward transitions
  it('validates: empty → scanned (backward)', () => {
    expect(transition('backward', 'empty', 'scanned')).toBe(true);
  });

  it('validates: analyzed → drafting (backward)', () => {
    expect(transition('backward', 'analyzed', 'drafting')).toBe(true);
  });

  it('validates: review → finalized (backward)', () => {
    expect(transition('backward', 'review', 'finalized')).toBe(true);
  });

  it('validates: review → drafting (backward, revision)', () => {
    expect(transition('backward', 'review', 'drafting')).toBe(true);
  });

  it('rejects: empty → drafting (backward)', () => {
    expect(() => transition('backward', 'empty', 'drafting')).toThrow();
  });

  // Sync transitions
  it('validates: synced → drifted (sync)', () => {
    expect(transition('sync', 'synced', 'drifted')).toBe(true);
  });

  it('validates: drifted → reconciling (sync)', () => {
    expect(transition('sync', 'drifted', 'reconciling')).toBe(true);
  });

  it('validates: reconciling → synced (sync)', () => {
    expect(transition('sync', 'reconciling', 'synced')).toBe(true);
  });

  it('rejects: synced → reconciling (sync, must drift first)', () => {
    expect(() => transition('sync', 'synced', 'reconciling')).toThrow();
  });
});

describe('document status', () => {
  it('returns null for unknown document', () => {
    expect(getDocumentStatus(temp.dir, 'tdd')).toBeNull();
  });

  it('tracks document status independently', () => {
    updateDocumentStatus(temp.dir, 'tdd', { status: 'finalized', version: '1.0', commit: 'abc1234' });
    updateDocumentStatus(temp.dir, 'hld', { status: 'drafting' });

    expect(getDocumentStatus(temp.dir, 'tdd').status).toBe('finalized');
    expect(getDocumentStatus(temp.dir, 'tdd').version).toBe('1.0');
    expect(getDocumentStatus(temp.dir, 'hld').status).toBe('drafting');
  });

  it('preserves other document statuses on update', () => {
    updateDocumentStatus(temp.dir, 'tdd', { status: 'finalized', version: '1.0' });
    updateDocumentStatus(temp.dir, 'hld', { status: 'drafting' });
    // TDD should still be there
    expect(getDocumentStatus(temp.dir, 'tdd').status).toBe('finalized');
  });
});

describe('getPipelineStatus', () => {
  it('returns status summary for all three pipelines', () => {
    updateState(temp.dir, {
      forward: { status: 'executing' },
      backward: { status: 'analyzed' },
      sync: { status: 'drifted' },
    });
    const status = getPipelineStatus(temp.dir);
    expect(status.forward).toBe('executing');
    expect(status.backward).toBe('analyzed');
    expect(status.sync).toBe('drifted');
    expect(status.mode).toBe('bidirectional');
  });
});

describe('transition maps', () => {
  it('forward has all expected states', () => {
    expect(FORWARD_TRANSITIONS).toHaveProperty('empty');
    expect(FORWARD_TRANSITIONS).toHaveProperty('researched');
    expect(FORWARD_TRANSITIONS).toHaveProperty('planned');
    expect(FORWARD_TRANSITIONS).toHaveProperty('executing');
    expect(FORWARD_TRANSITIONS).toHaveProperty('deployed');
    expect(FORWARD_TRANSITIONS).toHaveProperty('tested');
    expect(FORWARD_TRANSITIONS).toHaveProperty('verified');
  });

  it('backward has all expected states', () => {
    expect(BACKWARD_TRANSITIONS).toHaveProperty('empty');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('scanned');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('analyzed');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('drafting');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('review');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('finalized');
    expect(BACKWARD_TRANSITIONS).toHaveProperty('stale');
  });

  it('sync has all expected states', () => {
    expect(SYNC_TRANSITIONS).toHaveProperty('synced');
    expect(SYNC_TRANSITIONS).toHaveProperty('drifted');
    expect(SYNC_TRANSITIONS).toHaveProperty('reconciling');
  });
});
