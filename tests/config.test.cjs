/**
 * Tests for lib/config.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createTempPlanningDir } = require('./helpers.cjs');
const { DEFAULTS, loadConfig, get, set, initConfig } = require('../lib/config.cjs');

let temp;

beforeEach(() => {
  temp = createTempPlanningDir();
});

afterEach(() => {
  temp.cleanup();
});

describe('loadConfig', () => {
  it('returns defaults when no config file exists', () => {
    const config = loadConfig(temp.dir);
    expect(config.scan.max_files).toBe(10000);
    expect(config.models.analyzer).toBe('sonnet');
    expect(config.workflow.parallelization).toBe(true);
  });

  it('merges user config over defaults', () => {
    fs.writeFileSync(
      path.join(temp.dir, 'config.json'),
      JSON.stringify({ scan: { max_files: 5000 } }),
    );
    const config = loadConfig(temp.dir);
    expect(config.scan.max_files).toBe(5000);
    // Other scan defaults still present
    expect(config.scan.max_file_size_kb).toBe(500);
  });

  it('preserves full defaults for sections not in user config', () => {
    fs.writeFileSync(path.join(temp.dir, 'config.json'), JSON.stringify({ project: { name: 'test' } }));
    const config = loadConfig(temp.dir);
    expect(config.project.name).toBe('test');
    expect(config.scan.exclude_patterns).toContain('node_modules');
    expect(config.models.executor).toBe('sonnet');
    expect(config.sync.auto_sync).toBe(false);
  });

  it('handles malformed JSON gracefully', () => {
    fs.writeFileSync(path.join(temp.dir, 'config.json'), '{bad json');
    const config = loadConfig(temp.dir);
    // Should return all defaults
    expect(config.scan.max_files).toBe(10000);
  });
});

describe('get (dot-path resolution)', () => {
  it('resolves top-level key', () => {
    const value = get(temp.dir, 'workflow');
    expect(value).toHaveProperty('parallelization', true);
  });

  it('resolves nested key: scan.max_files', () => {
    const value = get(temp.dir, 'scan.max_files');
    expect(value).toBe(10000);
  });

  it('resolves deeply nested key: models.analyzer', () => {
    const value = get(temp.dir, 'models.analyzer');
    expect(value).toBe('sonnet');
  });

  it('returns undefined for nonexistent key', () => {
    const value = get(temp.dir, 'nonexistent.key.path');
    expect(value).toBeUndefined();
  });

  it('absent key returns default (absent=enabled pattern)', () => {
    // No config.json → all defaults
    expect(get(temp.dir, 'workflow.require_verification')).toBe(true);
    expect(get(temp.dir, 'sync.drift_check_on_execute')).toBe(true);
  });

  it('returns user-overridden value when set', () => {
    fs.writeFileSync(
      path.join(temp.dir, 'config.json'),
      JSON.stringify({ models: { analyzer: 'opus' } }),
    );
    expect(get(temp.dir, 'models.analyzer')).toBe('opus');
  });
});

describe('set', () => {
  it('creates config file if not exists', () => {
    set(temp.dir, 'project.name', 'my-project');
    const raw = JSON.parse(fs.readFileSync(path.join(temp.dir, 'config.json'), 'utf8'));
    expect(raw.project.name).toBe('my-project');
  });

  it('sets nested keys correctly', () => {
    set(temp.dir, 'scan.max_files', 20000);
    const value = get(temp.dir, 'scan.max_files');
    expect(value).toBe(20000);
  });

  it('creates intermediate objects for deep paths', () => {
    set(temp.dir, 'custom.deeply.nested.value', 42);
    const raw = JSON.parse(fs.readFileSync(path.join(temp.dir, 'config.json'), 'utf8'));
    expect(raw.custom.deeply.nested.value).toBe(42);
  });

  it('preserves existing keys when setting new ones', () => {
    set(temp.dir, 'project.name', 'first');
    set(temp.dir, 'project.description', 'second');
    const raw = JSON.parse(fs.readFileSync(path.join(temp.dir, 'config.json'), 'utf8'));
    expect(raw.project.name).toBe('first');
    expect(raw.project.description).toBe('second');
  });
});

describe('initConfig', () => {
  it('creates config.json with overrides', () => {
    initConfig(temp.dir, { project: { name: 'new-project' } });
    const raw = JSON.parse(fs.readFileSync(path.join(temp.dir, 'config.json'), 'utf8'));
    expect(raw.project.name).toBe('new-project');
  });

  it('does not overwrite existing config', () => {
    fs.writeFileSync(
      path.join(temp.dir, 'config.json'),
      JSON.stringify({ project: { name: 'existing' } }),
    );
    initConfig(temp.dir, { project: { name: 'new' } });
    const raw = JSON.parse(fs.readFileSync(path.join(temp.dir, 'config.json'), 'utf8'));
    expect(raw.project.name).toBe('existing');
  });

  it('returns merged config with defaults', () => {
    const config = initConfig(temp.dir, { models: { analyzer: 'haiku' } });
    expect(config.models.analyzer).toBe('haiku');
    expect(config.models.writer).toBe('sonnet'); // default
  });
});

describe('DEFAULTS', () => {
  it('has all three mode sections', () => {
    expect(DEFAULTS).toHaveProperty('scan');       // backward
    expect(DEFAULTS).toHaveProperty('analysis');    // backward
    expect(DEFAULTS).toHaveProperty('documents');   // backward
    expect(DEFAULTS).toHaveProperty('planning');    // forward
    expect(DEFAULTS).toHaveProperty('execution');   // forward
    expect(DEFAULTS).toHaveProperty('deploy');      // forward
    expect(DEFAULTS).toHaveProperty('testing');     // forward
    expect(DEFAULTS).toHaveProperty('sync');        // sync
  });

  it('has all model tiers', () => {
    expect(DEFAULTS.models).toHaveProperty('analyzer');
    expect(DEFAULTS.models).toHaveProperty('writer');
    expect(DEFAULTS.models).toHaveProperty('verifier');
    expect(DEFAULTS.models).toHaveProperty('researcher');
    expect(DEFAULTS.models).toHaveProperty('planner');
    expect(DEFAULTS.models).toHaveProperty('executor');
  });
});
