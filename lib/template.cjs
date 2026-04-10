/**
 * GTD Template Engine — Variable substitution, conditionals, file includes.
 *
 * Template syntax:
 *   {{variable_name}}                 — Replaced with context value
 *   {{#section_name}} ... {{/section_name}} — Conditional section (included if truthy)
 *   {{^section_name}} ... {{/section_name}} — Inverted section (included if falsy)
 *   {{@file:path}}                    — Inline file content
 *
 * @module lib/template
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve templates directory relative to package root
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

/**
 * Fill a template with variables.
 *
 * @param {string} templateContent - Raw template string
 * @param {object} variables - Key-value pairs for substitution
 * @returns {string} Filled template
 */
function fill(templateContent, variables) {
  let result = templateContent;

  // 1. Process conditional sections: {{#flag}} ... {{/flag}}
  result = result.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, key, content) => {
      return variables[key] ? content : '';
    },
  );

  // 2. Process inverted sections: {{^flag}} ... {{/flag}}
  result = result.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, key, content) => {
      return !variables[key] ? content : '';
    },
  );

  // 3. Process file includes: {{@file:path}}
  result = result.replace(/\{\{@file:(.*?)\}\}/g, (_match, filePath) => {
    try {
      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      return fs.readFileSync(resolved, 'utf8');
    } catch (_) {
      return `<!-- File not found: ${filePath} -->`;
    }
  });

  // 4. Process variable substitution: {{variable_name}}
  result = result.replace(/\{\{(\w[\w.]*)\}\}/g, (_match, key) => {
    const value = getNestedValue(variables, key);
    if (value === undefined || value === null) return _match; // Preserve unresolved
    return String(value);
  });

  return result;
}

/**
 * Load and fill a template by type and format.
 *
 * @param {string} type - Template type ('tdd', 'hld', 'lld', etc.)
 * @param {string} [format='standard'] - Format variant ('standard', 'enterprise', 'startup', 'compliance')
 * @param {object} variables - Variables for substitution
 * @returns {string} Filled template
 */
function loadAndFill(type, format, variables) {
  const templatePath = resolveTemplate(type, format);
  const content = fs.readFileSync(templatePath, 'utf8');
  return fill(content, variables);
}

/**
 * Resolve a template file path by type and format.
 * Resolution chain: format-specific → standard → default
 *
 * @param {string} type - Template type
 * @param {string} [format='standard'] - Format variant
 * @returns {string} Absolute path to template file
 * @throws {Error} If no template found
 */
function resolveTemplate(type, format) {
  const formatName = format || 'standard';

  // Check backward templates first, then forward
  const candidates = [
    path.join(TEMPLATES_DIR, 'backward', type, `${formatName}.md`),
    path.join(TEMPLATES_DIR, 'backward', type, 'standard.md'),
    path.join(TEMPLATES_DIR, 'backward', type, 'default.md'),
    path.join(TEMPLATES_DIR, 'forward', type, `${formatName}.md`),
    path.join(TEMPLATES_DIR, 'forward', type, 'standard.md'),
    path.join(TEMPLATES_DIR, type, `${formatName}.md`),
    path.join(TEMPLATES_DIR, type, 'standard.md'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Template not found for type="${type}", format="${formatName}". ` +
      `Searched: ${candidates.map((c) => path.relative(TEMPLATES_DIR, c)).join(', ')}`,
  );
}

/**
 * List all available template types and their formats.
 *
 * @returns {Array<{type: string, formats: string[]}>}
 */
function listTemplates() {
  const result = [];

  for (const subdir of ['backward', 'forward']) {
    const dir = path.join(TEMPLATES_DIR, subdir);
    if (!fs.existsSync(dir)) continue;

    for (const typeDir of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!typeDir.isDirectory()) continue;

      const typePath = path.join(dir, typeDir.name);
      const formats = fs.readdirSync(typePath)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace('.md', ''));

      if (formats.length > 0) {
        result.push({ type: typeDir.name, category: subdir, formats });
      }
    }
  }

  return result;
}

/**
 * Validate a template for syntax errors.
 *
 * @param {string} content - Template content
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTemplate(content) {
  const errors = [];

  // Check for unclosed conditional sections
  const opens = content.match(/\{\{#(\w+)\}\}/g) || [];
  const closes = content.match(/\{\{\/(\w+)\}\}/g) || [];

  const openNames = opens.map((m) => m.match(/\{\{#(\w+)\}\}/)[1]);
  const closeNames = closes.map((m) => m.match(/\{\{\/(\w+)\}\}/)[1]);

  for (const name of openNames) {
    if (!closeNames.includes(name)) {
      errors.push(`Unclosed section: {{#${name}}} has no matching {{/${name}}}`);
    }
  }

  for (const name of closeNames) {
    if (!openNames.includes(name)) {
      errors.push(`Orphaned close: {{/${name}}} has no matching {{#${name}}}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Utility ---

function getNestedValue(obj, dotPath) {
  const keys = dotPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

// CLI handler
function run(args) {
  const subcommand = args[0];

  if (subcommand === 'list') {
    process.stdout.write(JSON.stringify(listTemplates(), null, 2));
  } else if (subcommand === 'resolve' && args[1]) {
    try {
      const resolved = resolveTemplate(args[1], args[2]);
      process.stdout.write(resolved);
    } catch (err) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    }
  } else {
    process.stderr.write('Usage: gtd-tools.cjs template <list|resolve> [type] [format]\n');
    process.exit(1);
  }
}

module.exports = {
  fill,
  loadAndFill,
  resolveTemplate,
  listTemplates,
  validateTemplate,
  TEMPLATES_DIR,
  run,
};
