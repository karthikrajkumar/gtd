'use strict';

const fs = require('fs');
const path = require('path');
const { atomicWrite, ensureDir } = require('./file-ops.cjs');

function getBacklogDir(docsRoot) {
  return path.join(docsRoot, 'todos');
}

function getSeedsDir(docsRoot) {
  return path.join(docsRoot, 'seeds');
}

function getThreadsDir(docsRoot) {
  return path.join(docsRoot, 'threads');
}

function addBacklogItem(docsRoot, item) {
  const dir = getBacklogDir(docsRoot);
  ensureDir(dir);

  const manifestPath = path.join(dir, 'BACKLOG.json');
  let backlog = [];
  if (fs.existsSync(manifestPath)) {
    try { backlog = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { backlog = []; }
  }

  const entry = {
    id: backlog.length + 1,
    title: item.title,
    description: item.description || '',
    priority: item.priority || 'medium',
    tags: item.tags || [],
    created_at: new Date().toISOString(),
    status: 'open',
    source: item.source || 'manual',
  };

  backlog.push(entry);
  atomicWrite(manifestPath, JSON.stringify(backlog, null, 2));
  return entry;
}

function listBacklog(docsRoot, filters = {}) {
  const manifestPath = path.join(getBacklogDir(docsRoot), 'BACKLOG.json');
  if (!fs.existsSync(manifestPath)) return [];

  let backlog = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (filters.status) {
    backlog = backlog.filter((i) => i.status === filters.status);
  }
  if (filters.priority) {
    backlog = backlog.filter((i) => i.priority === filters.priority);
  }
  if (filters.tag) {
    backlog = backlog.filter((i) => i.tags.includes(filters.tag));
  }

  return backlog;
}

function plantSeed(docsRoot, seed) {
  const dir = getSeedsDir(docsRoot);
  ensureDir(dir);

  const manifestPath = path.join(dir, 'SEEDS.json');
  let seeds = [];
  if (fs.existsSync(manifestPath)) {
    try { seeds = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { seeds = []; }
  }

  const entry = {
    id: seeds.length + 1,
    idea: seed.idea,
    trigger: seed.trigger || null,
    context: seed.context || '',
    planted_at: new Date().toISOString(),
    status: 'dormant',
    sprouted_at: null,
  };

  seeds.push(entry);
  atomicWrite(manifestPath, JSON.stringify(seeds, null, 2));
  return entry;
}

function listSeeds(docsRoot) {
  const manifestPath = path.join(getSeedsDir(docsRoot), 'SEEDS.json');
  if (!fs.existsSync(manifestPath)) return [];
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return []; }
}

function createThread(docsRoot, thread) {
  const dir = getThreadsDir(docsRoot);
  ensureDir(dir);

  const slug = thread.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const threadDir = path.join(dir, slug);
  ensureDir(threadDir);

  const meta = {
    name: thread.name,
    created_at: new Date().toISOString(),
    description: thread.description || '',
    status: 'active',
  };

  atomicWrite(path.join(threadDir, 'META.json'), JSON.stringify(meta, null, 2));
  atomicWrite(path.join(threadDir, 'THREAD.md'), `# ${thread.name}\n\n${thread.description || ''}\n\n---\n\n`);
  return { slug, ...meta };
}

function appendToThread(docsRoot, slug, content) {
  const threadFile = path.join(getThreadsDir(docsRoot), slug, 'THREAD.md');
  if (!fs.existsSync(threadFile)) return false;

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const entry = `\n## ${timestamp}\n\n${content}\n\n---\n\n`;
  fs.appendFileSync(threadFile, entry);
  return true;
}

function listThreads(docsRoot) {
  const dir = getThreadsDir(docsRoot);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const metaPath = path.join(dir, d.name, 'META.json');
      if (!fs.existsSync(metaPath)) return null;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return { slug: d.name, ...meta };
      } catch { return null; }
    })
    .filter(Boolean);
}

module.exports = {
  addBacklogItem,
  listBacklog,
  plantSeed,
  listSeeds,
  createThread,
  appendToThread,
  listThreads,
  getBacklogDir,
  getSeedsDir,
  getThreadsDir,
};
