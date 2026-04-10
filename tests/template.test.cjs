/**
 * Tests for lib/template.cjs — Template engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { fill, resolveTemplate, listTemplates, validateTemplate, TEMPLATES_DIR } = require('../lib/template.cjs');
const { PROJECT_ROOT } = require('./helpers.cjs');

describe('fill — variable substitution', () => {
  it('replaces simple variables', () => {
    const result = fill('Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces multiple variables', () => {
    const result = fill('{{first}} {{last}}', { first: 'John', last: 'Doe' });
    expect(result).toBe('John Doe');
  });

  it('preserves unresolved variables', () => {
    const result = fill('Hello {{unknown}}!', {});
    expect(result).toBe('Hello {{unknown}}!');
  });

  it('handles nested dot-path variables', () => {
    const result = fill('Port: {{server.port}}', { server: { port: 3000 } });
    expect(result).toBe('Port: 3000');
  });

  it('converts numbers to strings', () => {
    const result = fill('Count: {{count}}', { count: 42 });
    expect(result).toBe('Count: 42');
  });

  it('handles boolean values', () => {
    const result = fill('Flag: {{enabled}}', { enabled: true });
    expect(result).toBe('Flag: true');
  });
});

describe('fill — conditional sections', () => {
  it('includes section when flag is truthy', () => {
    const result = fill('A{{#show}}B{{/show}}C', { show: true });
    expect(result).toBe('ABC');
  });

  it('excludes section when flag is falsy', () => {
    const result = fill('A{{#show}}B{{/show}}C', { show: false });
    expect(result).toBe('AC');
  });

  it('excludes section when flag is missing', () => {
    const result = fill('A{{#show}}B{{/show}}C', {});
    expect(result).toBe('AC');
  });

  it('handles multiline conditional content', () => {
    const template = 'Start\n{{#has_api}}\n## API Section\nContent here\n{{/has_api}}\nEnd';
    const with_api = fill(template, { has_api: true });
    expect(with_api).toContain('## API Section');
    const without_api = fill(template, { has_api: false });
    expect(without_api).not.toContain('## API Section');
    expect(without_api).toContain('Start');
    expect(without_api).toContain('End');
  });
});

describe('fill — inverted sections', () => {
  it('includes inverted section when flag is falsy', () => {
    const result = fill('{{^has_api}}No API{{/has_api}}', { has_api: false });
    expect(result).toBe('No API');
  });

  it('excludes inverted section when flag is truthy', () => {
    const result = fill('{{^has_api}}No API{{/has_api}}', { has_api: true });
    expect(result).toBe('');
  });
});

describe('fill — file includes', () => {
  it('includes file content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtd-tmpl-'));
    const tmpFile = path.join(tmpDir, 'include.txt');
    fs.writeFileSync(tmpFile, 'Included content');

    const result = fill(`Before {{@file:${tmpFile}}} After`, {});
    expect(result).toContain('Included content');

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('handles missing file gracefully', () => {
    const result = fill('{{@file:/nonexistent/path.txt}}', {});
    expect(result).toContain('File not found');
  });
});

describe('resolveTemplate', () => {
  it('resolves standard TDD template', () => {
    const resolved = resolveTemplate('tdd', 'standard');
    expect(resolved).toContain('tdd');
    expect(resolved).toContain('standard.md');
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it('resolves enterprise TDD template', () => {
    const resolved = resolveTemplate('tdd', 'enterprise');
    expect(resolved).toContain('enterprise.md');
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it('falls back to standard when format not found', () => {
    const resolved = resolveTemplate('hld', 'nonexistent-format');
    expect(resolved).toContain('standard.md');
  });

  it('throws for completely unknown type', () => {
    expect(() => resolveTemplate('unknown-type-xyz', 'standard')).toThrow(/Template not found/);
  });
});

describe('listTemplates', () => {
  it('lists available templates', () => {
    const templates = listTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('includes TDD template', () => {
    const templates = listTemplates();
    const tdd = templates.find((t) => t.type === 'tdd');
    expect(tdd).toBeTruthy();
    expect(tdd.formats).toContain('standard');
    expect(tdd.formats).toContain('enterprise');
  });

  it('includes all 7 backward document types', () => {
    const templates = listTemplates();
    const types = templates.filter((t) => t.category === 'backward').map((t) => t.type);
    expect(types).toContain('tdd');
    expect(types).toContain('hld');
    expect(types).toContain('lld');
    expect(types).toContain('capacity');
    expect(types).toContain('system-design');
    expect(types).toContain('api-docs');
    expect(types).toContain('runbook');
  });
});

describe('validateTemplate', () => {
  it('validates correct template', () => {
    const result = validateTemplate('Hello {{name}}! {{#show}}Visible{{/show}}');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects unclosed section', () => {
    const result = validateTemplate('{{#open}}Content without close');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unclosed section');
  });

  it('detects orphaned close', () => {
    const result = validateTemplate('Content {{/orphan}}');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Orphaned close');
  });

  it('validates all existing templates', () => {
    const templates = listTemplates();
    for (const tmpl of templates) {
      for (const format of tmpl.formats) {
        const resolved = resolveTemplate(tmpl.type, format);
        const content = fs.readFileSync(resolved, 'utf8');
        const result = validateTemplate(content);
        expect(result.valid, `Template ${tmpl.type}/${format} has errors: ${result.errors.join(', ')}`).toBe(true);
      }
    }
  });
});
