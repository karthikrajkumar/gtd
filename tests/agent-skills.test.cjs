/**
 * Tests for lib/agent-skills.cjs
 */

'use strict';

const {
  AGENT_REGISTRY,
  getAgentInfo,
  listAgents,
} = require('../lib/agent-skills.cjs');

describe('AGENT_REGISTRY', () => {
  it('has 33 total agents', () => {
    expect(Object.keys(AGENT_REGISTRY)).toHaveLength(33);
  });

  it('has 12 forward agents', () => {
    const forward = Object.values(AGENT_REGISTRY).filter((a) => a.category === 'forward');
    expect(forward).toHaveLength(12);
  });

  it('has 18 backward agents', () => {
    const backward = Object.values(AGENT_REGISTRY).filter((a) => a.category === 'backward');
    expect(backward).toHaveLength(18);
  });

  it('has 3 sync agents', () => {
    const sync = Object.values(AGENT_REGISTRY).filter((a) => a.category === 'sync');
    expect(sync).toHaveLength(3);
  });

  it('all agents have category and role', () => {
    for (const [name, info] of Object.entries(AGENT_REGISTRY)) {
      expect(info.category, `${name} should have category`).toBeTruthy();
      expect(info.role, `${name} should have role`).toBeTruthy();
      expect(['forward', 'backward', 'sync']).toContain(info.category);
    }
  });

  it('all agent names start with gtd-', () => {
    for (const name of Object.keys(AGENT_REGISTRY)) {
      expect(name.startsWith('gtd-'), `${name} should start with gtd-`).toBe(true);
    }
  });
});

describe('getAgentInfo', () => {
  it('returns info for known agent', () => {
    const info = getAgentInfo('gtd-executor');
    expect(info.category).toBe('forward');
    expect(info.role).toBe('execution');
  });

  it('returns null for unknown agent', () => {
    expect(getAgentInfo('gtd-nonexistent')).toBeNull();
  });

  it('returns correct category for each pipeline', () => {
    expect(getAgentInfo('gtd-planner').category).toBe('forward');
    expect(getAgentInfo('gtd-tdd-writer').category).toBe('backward');
    expect(getAgentInfo('gtd-drift-detector').category).toBe('sync');
  });
});

describe('listAgents', () => {
  it('lists all agents when no filter', () => {
    const all = listAgents();
    expect(all).toHaveLength(33);
  });

  it('filters by forward category', () => {
    const forward = listAgents('forward');
    expect(forward).toHaveLength(12);
    expect(forward).toContain('gtd-executor');
    expect(forward).toContain('gtd-planner');
    expect(forward).not.toContain('gtd-tdd-writer');
  });

  it('filters by backward category', () => {
    const backward = listAgents('backward');
    expect(backward).toHaveLength(18);
    expect(backward).toContain('gtd-tdd-writer');
    expect(backward).toContain('gtd-accuracy-verifier');
    expect(backward).not.toContain('gtd-executor');
  });

  it('filters by sync category', () => {
    const sync = listAgents('sync');
    expect(sync).toHaveLength(3);
    expect(sync).toContain('gtd-drift-detector');
  });
});
