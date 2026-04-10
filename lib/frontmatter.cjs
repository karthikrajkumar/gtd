/**
 * GTD Frontmatter Parser — YAML frontmatter between --- delimiters.
 * @module lib/frontmatter
 */

'use strict';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

/**
 * Parse YAML frontmatter from a Markdown string.
 * Supports simple key: value pairs and basic types (string, number, boolean, null).
 *
 * @param {string} content - Markdown content with optional frontmatter
 * @returns {{ frontmatter: object, body: string }}
 */
function parseFrontmatter(content) {
  if (!content || typeof content !== 'string') {
    return { frontmatter: {}, body: content || '' };
  }

  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const frontmatter = parseSimpleYaml(yamlBlock);

  return { frontmatter, body };
}

/**
 * Serialize frontmatter and body back to a Markdown string.
 *
 * @param {object} frontmatter - Key-value pairs
 * @param {string} body - Markdown body
 * @returns {string}
 */
function serializeFrontmatter(frontmatter, body) {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return body || '';
  }

  const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
    if (value === null || value === undefined) return `${key}: null`;
    if (typeof value === 'boolean') return `${key}: ${value}`;
    if (typeof value === 'number') return `${key}: ${value}`;
    if (typeof value === 'string' && value.includes(':')) return `${key}: "${value}"`;
    return `${key}: ${value}`;
  });

  return `---\n${yamlLines.join('\n')}\n---\n${body || ''}`;
}

/**
 * Parse simple YAML (flat key-value pairs only).
 * Handles: strings, numbers, booleans, null, quoted strings.
 *
 * @param {string} yaml - YAML block content
 * @returns {object}
 */
function parseSimpleYaml(yaml) {
  const result = {};
  const lines = yaml.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (value === 'null' || value === '~' || value === '') {
      value = null;
    } else if (!isNaN(Number(value)) && value !== '') {
      value = Number(value);
    }

    result[key] = value;
  }

  return result;
}

module.exports = {
  parseFrontmatter,
  serializeFrontmatter,
};
