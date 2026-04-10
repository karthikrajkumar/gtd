/**
 * Tests for lib/file-ops.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { atomicWrite, ensureDir, findProjectRoot, fileExists, readFileOr } = require('../lib/file-ops.cjs');

let tempDirs = [];

function createTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtd-fileops-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
  tempDirs = [];
});

describe('atomicWrite', () => {
  it('creates file with correct content', () => {
    const dir = createTempDir();
    const target = path.join(dir, 'test.txt');
    atomicWrite(target, 'hello world');
    expect(fs.readFileSync(target, 'utf8')).toBe('hello world');
  });

  it('creates parent directories if needed', () => {
    const dir = createTempDir();
    const target = path.join(dir, 'nested', 'deep', 'file.txt');
    atomicWrite(target, 'nested content');
    expect(fs.readFileSync(target, 'utf8')).toBe('nested content');
  });

  it('does not leave temp files on success', () => {
    const dir = createTempDir();
    const target = path.join(dir, 'clean.txt');
    atomicWrite(target, 'clean');
    const files = fs.readdirSync(dir);
    expect(files).toEqual(['clean.txt']);
  });

  it('overwrites existing file', () => {
    const dir = createTempDir();
    const target = path.join(dir, 'overwrite.txt');
    atomicWrite(target, 'first');
    atomicWrite(target, 'second');
    expect(fs.readFileSync(target, 'utf8')).toBe('second');
  });
});

describe('ensureDir', () => {
  it('creates directory recursively', () => {
    const dir = createTempDir();
    const nested = path.join(dir, 'a', 'b', 'c');
    ensureDir(nested);
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('is idempotent', () => {
    const dir = createTempDir();
    const nested = path.join(dir, 'idem');
    ensureDir(nested);
    ensureDir(nested); // Should not throw
    expect(fs.existsSync(nested)).toBe(true);
  });
});

describe('findProjectRoot', () => {
  it('finds directory with .git', () => {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, '.git'));
    const sub = path.join(dir, 'src', 'deep');
    fs.mkdirSync(sub, { recursive: true });
    expect(findProjectRoot(sub)).toBe(dir);
  });

  it('finds directory with package.json', () => {
    const dir = createTempDir();
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    const sub = path.join(dir, 'lib');
    fs.mkdirSync(sub);
    expect(findProjectRoot(sub)).toBe(dir);
  });

  it('finds directory with .planning', () => {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, '.planning'));
    expect(findProjectRoot(dir)).toBe(dir);
  });

  it('returns null when no root found', () => {
    const dir = createTempDir();
    // No .git, package.json, or .planning
    expect(findProjectRoot(dir)).toBe(null);
  });
});

describe('fileExists', () => {
  it('returns true for existing file', () => {
    const dir = createTempDir();
    const file = path.join(dir, 'exists.txt');
    fs.writeFileSync(file, 'yes');
    expect(fileExists(file)).toBe(true);
  });

  it('returns false for missing file', () => {
    expect(fileExists('/nonexistent/path/file.txt')).toBe(false);
  });

  it('returns false for directory', () => {
    const dir = createTempDir();
    expect(fileExists(dir)).toBe(false);
  });
});

describe('readFileOr', () => {
  it('reads existing file', () => {
    const dir = createTempDir();
    const file = path.join(dir, 'read.txt');
    fs.writeFileSync(file, 'content here');
    expect(readFileOr(file, 'default')).toBe('content here');
  });

  it('returns default for missing file', () => {
    expect(readFileOr('/no/such/file', 'fallback')).toBe('fallback');
  });
});
