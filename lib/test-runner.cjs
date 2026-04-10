/**
 * GTD Test Runner Module — Test framework detection, discovery, and execution.
 * @module lib/test-runner
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { fileExists } = require('./file-ops.cjs');

/**
 * Test framework detection rules.
 */
const TEST_FRAMEWORKS = [
  {
    name: 'vitest',
    detect: (root) => {
      const pkg = loadPkg(root);
      return (pkg?.devDependencies?.vitest || pkg?.dependencies?.vitest) ? true : false;
    },
    runCmd: 'npx vitest run',
    coverageCmd: 'npx vitest run --coverage',
    filePattern: '**/*.test.{ts,js,tsx,jsx}',
    configFiles: ['vitest.config.ts', 'vitest.config.js'],
  },
  {
    name: 'jest',
    detect: (root) => {
      const pkg = loadPkg(root);
      return (pkg?.devDependencies?.jest || pkg?.dependencies?.jest) ? true : false;
    },
    runCmd: 'npx jest',
    coverageCmd: 'npx jest --coverage',
    filePattern: '**/*.test.{ts,js,tsx,jsx}',
    configFiles: ['jest.config.ts', 'jest.config.js'],
  },
  {
    name: 'pytest',
    detect: (root) =>
      fileExists(path.join(root, 'pytest.ini')) ||
      fileExists(path.join(root, 'pyproject.toml')) ||
      fileExists(path.join(root, 'conftest.py')) ||
      fs.existsSync(path.join(root, 'tests')) && hasFiles(path.join(root, 'tests'), 'test_*.py'),
    runCmd: 'pytest',
    coverageCmd: 'pytest --cov',
    filePattern: '**/test_*.py',
    configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
  },
  {
    name: 'go-test',
    detect: (root) =>
      fileExists(path.join(root, 'go.mod')) &&
      hasFiles(root, '*_test.go'),
    runCmd: 'go test ./...',
    coverageCmd: 'go test ./... -cover',
    filePattern: '**/*_test.go',
    configFiles: [],
  },
  {
    name: 'cargo-test',
    detect: (root) => fileExists(path.join(root, 'Cargo.toml')),
    runCmd: 'cargo test',
    coverageCmd: 'cargo tarpaulin',
    filePattern: '**/tests/**/*.rs',
    configFiles: ['Cargo.toml'],
  },
  {
    name: 'rspec',
    detect: (root) =>
      fileExists(path.join(root, 'Gemfile')) &&
      fs.existsSync(path.join(root, 'spec')),
    runCmd: 'bundle exec rspec',
    coverageCmd: 'bundle exec rspec',
    filePattern: 'spec/**/*_spec.rb',
    configFiles: ['.rspec', 'spec/spec_helper.rb'],
  },
];

/**
 * Detect the test framework for a project.
 * @param {string} projectRoot - Project root directory
 * @returns {{ name: string, runCmd: string, coverageCmd: string, filePattern: string }|null}
 */
function detectTestFramework(projectRoot) {
  for (const fw of TEST_FRAMEWORKS) {
    if (fw.detect(projectRoot)) {
      return {
        name: fw.name,
        runCmd: fw.runCmd,
        coverageCmd: fw.coverageCmd,
        filePattern: fw.filePattern,
      };
    }
  }
  return null;
}

/**
 * Count test files in a project.
 * @param {string} projectRoot - Project root directory
 * @param {string} [pattern] - Glob pattern for test files
 * @returns {number}
 */
function countTestFiles(projectRoot, pattern) {
  const fw = detectTestFramework(projectRoot);
  if (!fw && !pattern) return 0;

  const searchPattern = pattern || fw.filePattern;
  let count = 0;

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (matchesTestPattern(entry.name, searchPattern)) {
        count++;
      }
    }
  }

  walk(projectRoot);
  return count;
}

/**
 * Get test infrastructure summary.
 * @param {string} projectRoot - Project root directory
 * @returns {{ framework: string|null, testFiles: number, hasConfig: boolean, runCmd: string|null }}
 */
function getTestSummary(projectRoot) {
  const fw = detectTestFramework(projectRoot);
  if (!fw) {
    return { framework: null, testFiles: 0, hasConfig: false, runCmd: null };
  }

  const testFiles = countTestFiles(projectRoot, fw.filePattern);
  const hasConfig = fw.configFiles
    ? fw.configFiles.some((cf) => fileExists(path.join(projectRoot, cf)))
    : false;

  return {
    framework: fw.name,
    testFiles,
    hasConfig,
    runCmd: fw.runCmd,
    coverageCmd: fw.coverageCmd,
  };
}

// --- Helpers ---

function loadPkg(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch (_) {
    return null;
  }
}

function hasFiles(dir, pattern) {
  try {
    return fs.readdirSync(dir).some((f) => matchesTestPattern(f, pattern));
  } catch (_) {
    return false;
  }
}

function matchesTestPattern(filename, pattern) {
  // Simple pattern matching: *.test.js, test_*.py, *_test.go
  if (pattern.includes('test_*.py')) return filename.startsWith('test_') && filename.endsWith('.py');
  if (pattern.includes('*_test.go')) return filename.endsWith('_test.go');
  if (pattern.includes('*_spec.rb')) return filename.endsWith('_spec.rb');
  if (pattern.includes('*.test.')) return filename.includes('.test.');
  return false;
}

// CLI handler
function run(args) {
  const projectRoot = process.cwd();
  const subcommand = args[0] || 'detect';

  if (subcommand === 'detect') {
    process.stdout.write(JSON.stringify(getTestSummary(projectRoot), null, 2));
  } else if (subcommand === 'count') {
    process.stdout.write(JSON.stringify(countTestFiles(projectRoot)));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs test <detect|count>\n');
    process.exit(1);
  }
}

module.exports = {
  TEST_FRAMEWORKS,
  detectTestFramework,
  countTestFiles,
  getTestSummary,
  run,
};
