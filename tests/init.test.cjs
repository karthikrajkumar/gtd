/**
 * Tests for lib/init.cjs
 */

'use strict';

const path = require('path');
const { createTempPlanningDir } = require('./helpers.cjs');
const { parseWorkflowArgs, WORKFLOW_CONTEXT, buildGitContext } = require('../lib/init.cjs');

describe('WORKFLOW_CONTEXT', () => {
  it('has entries for backward workflows', () => {
    expect(WORKFLOW_CONTEXT).toHaveProperty('scan-codebase');
    expect(WORKFLOW_CONTEXT).toHaveProperty('generate-document');
    expect(WORKFLOW_CONTEXT).toHaveProperty('create-all');
    expect(WORKFLOW_CONTEXT).toHaveProperty('verify-document');
  });

  it('has entries for forward workflows', () => {
    expect(WORKFLOW_CONTEXT).toHaveProperty('new-project');
    expect(WORKFLOW_CONTEXT).toHaveProperty('plan-phase');
    expect(WORKFLOW_CONTEXT).toHaveProperty('execute-phase');
    expect(WORKFLOW_CONTEXT).toHaveProperty('deploy-local');
    expect(WORKFLOW_CONTEXT).toHaveProperty('test-phase');
  });

  it('has entries for sync workflows', () => {
    expect(WORKFLOW_CONTEXT).toHaveProperty('detect-drift');
    expect(WORKFLOW_CONTEXT).toHaveProperty('reconcile');
    expect(WORKFLOW_CONTEXT).toHaveProperty('sync');
    expect(WORKFLOW_CONTEXT).toHaveProperty('audit');
  });

  it('has entries for utility workflows', () => {
    expect(WORKFLOW_CONTEXT).toHaveProperty('help');
    expect(WORKFLOW_CONTEXT).toHaveProperty('status');
    expect(WORKFLOW_CONTEXT).toHaveProperty('settings');
  });

  it('all entries are arrays of context slices', () => {
    for (const [name, slices] of Object.entries(WORKFLOW_CONTEXT)) {
      expect(Array.isArray(slices), `${name} should have array of slices`).toBe(true);
      expect(slices.length, `${name} should have at least 1 slice`).toBeGreaterThan(0);
    }
  });
});

describe('parseWorkflowArgs', () => {
  it('parses --auto flag', () => {
    const parsed = parseWorkflowArgs('plan-phase', ['3', '--auto']);
    expect(parsed.auto).toBe(true);
    expect(parsed.positional).toBe('3');
  });

  it('parses --format flag with value', () => {
    const parsed = parseWorkflowArgs('generate-document', ['tdd', '--format', 'enterprise']);
    expect(parsed.format).toBe('enterprise');
    expect(parsed.doc_type).toBe('tdd');
  });

  it('parses --since flag', () => {
    const parsed = parseWorkflowArgs('incremental-update', ['--since', 'abc1234']);
    expect(parsed.since).toBe('abc1234');
  });

  it('parses --force flag', () => {
    const parsed = parseWorkflowArgs('scan-codebase', ['--force']);
    expect(parsed.force).toBe(true);
  });

  it('parses --wave flag for execute-phase', () => {
    const parsed = parseWorkflowArgs('execute-phase', ['2', '--wave', '3']);
    expect(parsed.phase_number).toBe(2);
    expect(parsed.wave).toBe(3);
  });

  it('parses --strategy for reconcile', () => {
    const parsed = parseWorkflowArgs('reconcile', ['--strategy', 'code-wins']);
    expect(parsed.strategy).toBe('code-wins');
  });

  it('parses --focus for analyze', () => {
    const parsed = parseWorkflowArgs('analyze-codebase', ['--focus', 'architecture']);
    expect(parsed.focus).toBe('architecture');
  });

  it('interprets positional as doc_type for generate-document', () => {
    const parsed = parseWorkflowArgs('generate-document', ['hld']);
    expect(parsed.doc_type).toBe('hld');
  });

  it('interprets positional as phase_number for plan-phase', () => {
    const parsed = parseWorkflowArgs('plan-phase', ['5']);
    expect(parsed.phase_number).toBe(5);
  });

  it('preserves raw args', () => {
    const parsed = parseWorkflowArgs('test', ['--auto', '--format', 'enterprise', 'tdd']);
    expect(parsed.raw).toEqual(['--auto', '--format', 'enterprise', 'tdd']);
  });
});

describe('buildGitContext', () => {
  it('returns available:false for non-git directory', () => {
    const temp = createTempPlanningDir();
    const ctx = buildGitContext(temp.root);
    expect(ctx.available).toBe(false);
    temp.cleanup();
  });

  it('returns git info for current project (which is a git repo)', () => {
    const projectRoot = path.resolve(__dirname, '..');
    const ctx = buildGitContext(projectRoot);
    // This test project is a git repo (we initialized it in Phase 0)
    expect(ctx.available).toBe(true);
    expect(ctx).toHaveProperty('commit');
    expect(ctx).toHaveProperty('branch');
    expect(ctx).toHaveProperty('has_changes');
  });
});
