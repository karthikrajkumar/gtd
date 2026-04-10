/**
 * GTD Deploy Module — Local deployment method detection, build, health check.
 * @module lib/deploy
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fileExists } = require('./file-ops.cjs');

/**
 * Deployment method detection rules.
 * Ordered by specificity — first match wins.
 */
const DEPLOY_METHODS = [
  {
    name: 'docker-compose',
    detect: (root) =>
      fileExists(path.join(root, 'docker-compose.yml')) ||
      fileExists(path.join(root, 'docker-compose.yaml')) ||
      fileExists(path.join(root, 'compose.yml')) ||
      fileExists(path.join(root, 'compose.yaml')),
    buildCmd: null,
    startCmd: 'docker compose up -d',
    stopCmd: 'docker compose down',
    healthDefault: 'http://localhost:3000/health',
  },
  {
    name: 'dockerfile',
    detect: (root) => fileExists(path.join(root, 'Dockerfile')),
    buildCmd: 'docker build -t gtd-local .',
    startCmd: 'docker run -d -p 3000:3000 --name gtd-local gtd-local',
    stopCmd: 'docker stop gtd-local && docker rm gtd-local',
    healthDefault: 'http://localhost:3000/health',
  },
  {
    name: 'npm-start',
    detect: (root) => {
      const pkg = loadPackageJson(root);
      return pkg && pkg.scripts && pkg.scripts.start;
    },
    buildCmd: (root) => {
      const pkg = loadPackageJson(root);
      return pkg?.scripts?.build ? 'npm run build' : null;
    },
    startCmd: 'npm start',
    stopCmd: null, // Process killed by signal
    healthDefault: 'http://localhost:3000/health',
  },
  {
    name: 'npm-dev',
    detect: (root) => {
      const pkg = loadPackageJson(root);
      return pkg && pkg.scripts && pkg.scripts.dev;
    },
    buildCmd: null,
    startCmd: 'npm run dev',
    stopCmd: null,
    healthDefault: 'http://localhost:3000',
  },
  {
    name: 'python-uvicorn',
    detect: (root) => {
      if (!fileExists(path.join(root, 'pyproject.toml')) && !fileExists(path.join(root, 'requirements.txt'))) return false;
      try {
        const content = fs.readFileSync(path.join(root, 'pyproject.toml'), 'utf8');
        return content.includes('fastapi') || content.includes('uvicorn');
      } catch (_) {
        try {
          const req = fs.readFileSync(path.join(root, 'requirements.txt'), 'utf8');
          return req.includes('fastapi') || req.includes('uvicorn');
        } catch (__) { return false; }
      }
    },
    buildCmd: 'pip install -r requirements.txt',
    startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000',
    stopCmd: null,
    healthDefault: 'http://localhost:8000/health',
  },
  {
    name: 'python-manage',
    detect: (root) => fileExists(path.join(root, 'manage.py')),
    buildCmd: 'python manage.py migrate',
    startCmd: 'python manage.py runserver 0.0.0.0:8000',
    stopCmd: null,
    healthDefault: 'http://localhost:8000/',
  },
  {
    name: 'go-run',
    detect: (root) => fileExists(path.join(root, 'go.mod')) && fileExists(path.join(root, 'main.go')),
    buildCmd: 'go build -o ./app .',
    startCmd: './app',
    stopCmd: null,
    healthDefault: 'http://localhost:8080/health',
  },
  {
    name: 'cargo-run',
    detect: (root) => fileExists(path.join(root, 'Cargo.toml')),
    buildCmd: 'cargo build --release',
    startCmd: './target/release/*',
    stopCmd: null,
    healthDefault: 'http://localhost:8080/health',
  },
];

/**
 * Detect the deployment method for a project.
 * @param {string} projectRoot - Project root directory
 * @returns {{ name: string, buildCmd: string|null, startCmd: string, stopCmd: string|null, healthDefault: string }|null}
 */
function detectDeployMethod(projectRoot) {
  for (const method of DEPLOY_METHODS) {
    if (method.detect(projectRoot)) {
      return {
        name: method.name,
        buildCmd: typeof method.buildCmd === 'function' ? method.buildCmd(projectRoot) : method.buildCmd,
        startCmd: method.startCmd,
        stopCmd: method.stopCmd,
        healthDefault: method.healthDefault,
      };
    }
  }
  return null;
}

/**
 * Detect the port a project uses.
 * @param {string} projectRoot - Project root directory
 * @returns {number|null}
 */
function detectPort(projectRoot) {
  // Check common env files
  for (const envFile of ['.env', '.env.local', '.env.development']) {
    const envPath = path.join(projectRoot, envFile);
    if (fileExists(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^PORT\s*=\s*(\d+)/m);
        if (match) return parseInt(match[1], 10);
      } catch (_) {}
    }
  }

  // Check docker-compose for port mappings
  for (const composeFile of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml']) {
    const composePath = path.join(projectRoot, composeFile);
    if (fileExists(composePath)) {
      try {
        const content = fs.readFileSync(composePath, 'utf8');
        const match = content.match(/(\d+):(\d+)/);
        if (match) return parseInt(match[1], 10);
      } catch (_) {}
    }
  }

  // Check package.json scripts for --port flags
  const pkg = loadPackageJson(projectRoot);
  if (pkg?.scripts) {
    const scripts = JSON.stringify(pkg.scripts);
    const match = scripts.match(/--port\s+(\d+)|PORT=(\d+)|-p\s+(\d+)/);
    if (match) return parseInt(match[1] || match[2] || match[3], 10);
  }

  return null; // Unknown — agent will detect at runtime
}

/**
 * Check if a port is in use.
 * @param {number} port - Port to check
 * @returns {boolean}
 */
function isPortInUse(port) {
  try {
    execSync(`lsof -i :${port} -t`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Load package.json from a directory.
 * @param {string} dir - Directory path
 * @returns {object|null}
 */
function loadPackageJson(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch (_) {
    return null;
  }
}

// CLI handler
function run(args) {
  const projectRoot = process.cwd();
  const subcommand = args[0] || 'detect';

  if (subcommand === 'detect') {
    const method = detectDeployMethod(projectRoot);
    const port = detectPort(projectRoot);
    process.stdout.write(JSON.stringify({ method, port }, null, 2));
  } else if (subcommand === 'port') {
    const port = detectPort(projectRoot);
    process.stdout.write(JSON.stringify(port));
  } else if (subcommand === 'check-port' && args[1]) {
    process.stdout.write(JSON.stringify(isPortInUse(parseInt(args[1], 10))));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs deploy <detect|port|check-port> [port]\n');
    process.exit(1);
  }
}

module.exports = {
  DEPLOY_METHODS,
  detectDeployMethod,
  detectPort,
  isPortInUse,
  run,
};
