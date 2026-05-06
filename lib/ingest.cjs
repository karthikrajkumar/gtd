'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('./file-ops.cjs');

const SUPPORTED_IMPORT_FORMATS = ['markdown', 'text', 'pdf-text', 'url-list'];

function ingestFile(filePath, docsRoot, options = {}) {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const ingestDir = path.join(docsRoot, 'ingested');
  if (!fs.existsSync(ingestDir)) {
    fs.mkdirSync(ingestDir, { recursive: true });
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { success: false, error: `Cannot read file: ${err.message}` };
  }

  const result = {
    original_path: filePath,
    ingested_at: new Date().toISOString(),
    format: ext.replace('.', '') || 'txt',
    size: Buffer.byteLength(content, 'utf8'),
  };

  const outputName = options.rename || basename;
  const outputPath = path.join(ingestDir, outputName);

  let processed = content;
  if (options.strip_frontmatter) {
    processed = processed.replace(/^---[\s\S]*?---\n*/, '');
  }
  if (options.max_lines) {
    const lines = processed.split('\n');
    if (lines.length > options.max_lines) {
      processed = lines.slice(0, options.max_lines).join('\n');
      processed += `\n\n<!-- Truncated at ${options.max_lines} lines -->`;
    }
  }

  atomicWrite(outputPath, processed);
  result.output_path = outputPath;
  result.success = true;

  const manifestPath = path.join(ingestDir, 'MANIFEST.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      manifest = [];
    }
  }
  manifest.push(result);
  atomicWrite(manifestPath, JSON.stringify(manifest, null, 2));

  return result;
}

function ingestUrl(url, content, docsRoot, options = {}) {
  const ingestDir = path.join(docsRoot, 'ingested');
  if (!fs.existsSync(ingestDir)) {
    fs.mkdirSync(ingestDir, { recursive: true });
  }

  const slug =
    options.name ||
    url
      .replace(/https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '-')
      .slice(0, 60);
  const outputPath = path.join(ingestDir, `${slug}.md`);

  const header = `---\nsource: ${url}\ningested_at: ${new Date().toISOString()}\n---\n\n`;
  atomicWrite(outputPath, header + content);

  const result = {
    original_url: url,
    ingested_at: new Date().toISOString(),
    format: 'url',
    output_path: outputPath,
    success: true,
  };

  const manifestPath = path.join(ingestDir, 'MANIFEST.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      manifest = [];
    }
  }
  manifest.push(result);
  atomicWrite(manifestPath, JSON.stringify(manifest, null, 2));

  return result;
}

function listIngested(docsRoot) {
  const manifestPath = path.join(docsRoot, 'ingested', 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return [];
  }
}

module.exports = {
  ingestFile,
  ingestUrl,
  listIngested,
  SUPPORTED_IMPORT_FORMATS,
};
