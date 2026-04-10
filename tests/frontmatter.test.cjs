/**
 * Tests for lib/frontmatter.cjs
 */

'use strict';

const { parseFrontmatter, serializeFrontmatter } = require('../lib/frontmatter.cjs');

describe('parseFrontmatter', () => {
  it('parses standard YAML frontmatter', () => {
    const content = '---\ntitle: Hello\nversion: 1\n---\n# Body';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter.title).toBe('Hello');
    expect(frontmatter.version).toBe(1);
    expect(body).toBe('# Body');
  });

  it('handles boolean values', () => {
    const content = '---\nenabled: true\ndisabled: false\n---\nbody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.enabled).toBe(true);
    expect(frontmatter.disabled).toBe(false);
  });

  it('handles null values', () => {
    const content = '---\nfield: null\nempty:\n---\nbody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.field).toBe(null);
    expect(frontmatter.empty).toBe(null);
  });

  it('handles quoted strings', () => {
    const content = '---\npath: "src/index.js"\nsingle: \'hello\'\n---\nbody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.path).toBe('src/index.js');
    expect(frontmatter.single).toBe('hello');
  });

  it('returns empty frontmatter when none present', () => {
    const content = '# Just a heading\nSome text';
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter).toEqual({});
    expect(body).toBe('# Just a heading\nSome text');
  });

  it('handles null/undefined input', () => {
    expect(parseFrontmatter(null).frontmatter).toEqual({});
    expect(parseFrontmatter(undefined).frontmatter).toEqual({});
    expect(parseFrontmatter('').frontmatter).toEqual({});
  });

  it('ignores comment lines in YAML', () => {
    const content = '---\n# comment\ntitle: Real\n---\nbody';
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.title).toBe('Real');
    expect(Object.keys(frontmatter)).toHaveLength(1);
  });
});

describe('serializeFrontmatter', () => {
  it('produces valid frontmatter block', () => {
    const result = serializeFrontmatter({ title: 'Test', version: 1 }, '# Body');
    expect(result).toContain('---');
    expect(result).toContain('title: Test');
    expect(result).toContain('version: 1');
    expect(result).toContain('# Body');
  });

  it('handles empty frontmatter', () => {
    const result = serializeFrontmatter({}, '# Body');
    expect(result).toBe('# Body');
  });

  it('round-trips correctly', () => {
    const original = { status: 'active', count: 42, flag: true };
    const body = '# Content\nSome text here';
    const serialized = serializeFrontmatter(original, body);
    const { frontmatter, body: parsedBody } = parseFrontmatter(serialized);
    expect(frontmatter.status).toBe('active');
    expect(frontmatter.count).toBe(42);
    expect(frontmatter.flag).toBe(true);
    expect(parsedBody).toBe(body);
  });

  it('quotes strings containing colons', () => {
    const result = serializeFrontmatter({ url: 'http://localhost:3000' }, '');
    expect(result).toContain('"http://localhost:3000"');
  });
});
