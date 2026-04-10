/**
 * Tests for Phase 2: Discovery Engine — Codebase Scanner
 *
 * Tests the scanner infrastructure, agent definition, and output format.
 * NOTE: These tests verify the FRAMEWORK around the scanner, not the LLM agent itself.
 * The actual agent is tested via the proof-of-life manual test.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  PROJECT_ROOT,
  fixturePath,
  createTempPlanningDir,
  writePlanningFile,
  readPlanningFile,
  mockGitCommit,
} = require('./helpers.cjs');
const { getAnalysisStatus, getCodebaseMapStatus } = require('../lib/analysis.cjs');
const { loadState, updateState } = require('../lib/state.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');

// --- Agent definition tests ---

describe('Codebase mapper agent definition', () => {
  const agentPath = path.join(PROJECT_ROOT, 'agents/backward/gtd-codebase-mapper.md');

  it('exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  it('has valid YAML frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-codebase-mapper');
    expect(frontmatter.category).toBe('backward');
    expect(frontmatter.role).toBe('discovery');
  });

  it('has required tools listed in body', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    // Our simple YAML parser doesn't handle arrays, so check the raw content
    expect(content).toContain('- Read');
    expect(content).toContain('- Bash');
    expect(content).toContain('- Grep');
    expect(content).toContain('- Glob');
    expect(content).toContain('- Write');
  });

  it('contains process steps', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('Step 1: File Discovery');
    expect(content).toContain('Step 2: Language Detection');
    expect(content).toContain('Step 3: Framework Fingerprinting');
    expect(content).toContain('Step 4: Entry Point Identification');
    expect(content).toContain('Step 5: Module Boundary Detection');
    expect(content).toContain('Step 6: Infrastructure Detection');
    expect(content).toContain('Step 7: Database Schema Detection');
    expect(content).toContain('Step 8: Dependency Summary');
    expect(content).toContain('Step 9: Write Outputs');
  });

  it('specifies both output artifacts', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('CODEBASE-MAP.md');
    expect(content).toContain('FILE-INDEX.json');
  });

  it('has quality rules about .env safety', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('NEVER read .env files');
  });
});

// --- Reference documents tests ---

describe('Framework signatures reference', () => {
  const refPath = path.join(PROJECT_ROOT, 'references/framework-signatures.md');

  it('exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  it('covers JavaScript frameworks', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Next.js');
    expect(content).toContain('Express');
    expect(content).toContain('React');
    expect(content).toContain('NestJS');
  });

  it('covers Python frameworks', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Django');
    expect(content).toContain('FastAPI');
    expect(content).toContain('Flask');
  });

  it('covers Go frameworks', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Gin');
    expect(content).toContain('Echo');
  });

  it('covers Rust frameworks', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Actix');
    expect(content).toContain('Axum');
  });

  it('covers infrastructure tools', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Docker');
    expect(content).toContain('Kubernetes');
    expect(content).toContain('Terraform');
    expect(content).toContain('GitHub Actions');
  });

  it('covers ORM/database tools', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Prisma');
    expect(content).toContain('Drizzle');
    expect(content).toContain('SQLAlchemy');
  });

  it('includes confidence scores', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('confidence: 90');
    expect(content).toContain('confidence: 95');
  });
});

describe('Language analyzers reference', () => {
  const refPath = path.join(PROJECT_ROOT, 'references/language-analyzers.md');

  it('exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  it('covers file extension detection', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('.ts');
    expect(content).toContain('.py');
    expect(content).toContain('.go');
    expect(content).toContain('.rs');
    expect(content).toContain('.java');
  });

  it('covers entry point conventions', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Entry Point Conventions');
    expect(content).toContain('index.ts');
    expect(content).toContain('main.py');
    expect(content).toContain('main.go');
  });

  it('covers test conventions', () => {
    const content = fs.readFileSync(refPath, 'utf8');
    expect(content).toContain('Test Conventions');
    expect(content).toContain('Jest');
    expect(content).toContain('pytest');
  });
});

// --- Scan workflow tests ---

describe('Scan workflow', () => {
  const workflowPath = path.join(PROJECT_ROOT, 'workflows/backward/scan-codebase.md');

  it('exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('references framework-signatures', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('framework-signatures');
  });

  it('references language-analyzers', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('language-analyzers');
  });

  it('has initialize step', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-tools.cjs');
    expect(content).toContain('init scan-codebase');
  });

  it('has staleness check', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('codebase_map.stale');
  });

  it('spawns gtd-codebase-mapper', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-codebase-mapper');
  });

  it('updates state after scan', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('state update');
    expect(content).toContain('backward.status');
  });

  it('has error handling', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('error_handling');
  });
});

// --- Scan command tests ---

describe('Scan command', () => {
  const cmdPath = path.join(PROJECT_ROOT, 'commands/gtd/backward/scan.md');

  it('exists', () => {
    expect(fs.existsSync(cmdPath)).toBe(true);
  });

  it('has correct frontmatter name', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-scan');
  });

  it('references the scan workflow', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).toContain('scan-codebase.md');
  });

  it('documents --force flag', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).toContain('--force');
  });

  it('documents --deep flag', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).toContain('--deep');
  });
});

// --- Simulated scan output validation ---

describe('Scan output format validation', () => {
  let temp;

  beforeEach(() => {
    temp = createTempPlanningDir();
  });

  afterEach(() => {
    temp.cleanup();
  });

  it('validates CODEBASE-MAP.md format', () => {
    const commit = mockGitCommit();
    const mapContent = `---
commit: ${commit}
timestamp: 2026-04-10T10:00:00Z
files_indexed: 20
scan_depth: standard
---

# Codebase Map

## Project Identity
- **Name:** todo-api
- **Description:** A REST API for managing todos with authentication
- **Languages:** JavaScript (100%)
- **Primary Language:** JavaScript
- **Frameworks:** Express.js (4.21.0) — 90%
- **Build System:** npm
- **Runtime:** Node.js 20

## Architecture Fingerprint
- **Pattern:** Monolith
- **API Style:** REST
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT (jsonwebtoken)
- **Deployment:** Docker

## Module Map
| Module | Path | Purpose | Files | Language |
|--------|------|---------|-------|----------|
| routes | src/routes/ | API route handlers | 5 | JavaScript |
| models | src/models/ | Data models | 3 | JavaScript |
| middleware | src/middleware/ | Express middleware | 2 | JavaScript |

## Entry Points
| File | Type | Description |
|------|------|-------------|
| src/app.js | api | Express application entry |

## Infrastructure
| Tool | Config File | Purpose |
|------|-------------|---------|
| Docker | Dockerfile | Container build |
| GitHub Actions | .github/workflows/ci.yml | CI pipeline |
| Prisma | prisma/schema.prisma | ORM / migrations |
`;

    writePlanningFile(temp.dir, 'CODEBASE-MAP.md', mapContent);

    // Verify it's parseable
    const content = readPlanningFile(temp.dir, 'CODEBASE-MAP.md');
    const { frontmatter, body } = parseFrontmatter(content);

    expect(frontmatter.commit).toBe(commit);
    expect(frontmatter.files_indexed).toBe(20);
    expect(body).toContain('## Project Identity');
    expect(body).toContain('## Architecture Fingerprint');
    expect(body).toContain('## Module Map');
    expect(body).toContain('## Entry Points');
    expect(body).toContain('## Infrastructure');

    // Verify codebase map status detection
    const status = getCodebaseMapStatus(temp.dir);
    expect(status.exists).toBe(true);
    expect(status.commit).toBe(commit);
  });

  it('validates FILE-INDEX.json format', () => {
    const fileIndex = {
      version: '1.0',
      commit: mockGitCommit(),
      timestamp: '2026-04-10T10:00:00Z',
      stats: {
        total_files: 20,
        total_lines_estimate: 1500,
        languages: {
          JavaScript: { files: 15, percentage: 75 },
          Prisma: { files: 1, percentage: 5 },
          YAML: { files: 2, percentage: 10 },
          Dockerfile: { files: 1, percentage: 5 },
          JSON: { files: 1, percentage: 5 },
        },
      },
      modules: [
        {
          path: 'src/routes',
          purpose: 'API route handlers',
          file_count: 5,
          primary_language: 'JavaScript',
          entry_points: [],
        },
        {
          path: 'src/models',
          purpose: 'Data models',
          file_count: 3,
          primary_language: 'JavaScript',
          entry_points: [],
        },
      ],
      entry_points: [
        { file: 'src/app.js', type: 'api' },
      ],
      frameworks: [
        { name: 'Express.js', version: '4.21.0', confidence: 90 },
      ],
      infrastructure: {
        docker: true,
        kubernetes: false,
        ci_cd: 'github-actions',
        iac: null,
      },
    };

    writePlanningFile(temp.dir, 'analysis/FILE-INDEX.json', JSON.stringify(fileIndex, null, 2));

    // Verify it's parseable
    const raw = readPlanningFile(temp.dir, 'analysis/FILE-INDEX.json');
    const parsed = JSON.parse(raw);

    expect(parsed.version).toBe('1.0');
    expect(parsed.stats.total_files).toBe(20);
    expect(parsed.stats.languages.JavaScript.percentage).toBe(75);
    expect(parsed.modules).toHaveLength(2);
    expect(parsed.entry_points[0].type).toBe('api');
    expect(parsed.frameworks[0].name).toBe('Express.js');
    expect(parsed.infrastructure.docker).toBe(true);
    expect(parsed.infrastructure.kubernetes).toBe(false);
  });

  it('state updates correctly after simulated scan', () => {
    const commit = mockGitCommit();

    // Simulate what the scan workflow does after agent completes
    updateState(temp.dir, {
      backward: {
        status: 'scanned',
        last_scan_commit: commit,
      },
    });

    const state = loadState(temp.dir);
    expect(state.backward.status).toBe('scanned');
    expect(state.backward.last_scan_commit).toBe(commit);
  });
});

// --- Test fixture validation ---

describe('Test fixtures are scannable', () => {
  it('micro-project has expected structure', () => {
    const p = fixturePath('micro-project');
    const files = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(p, full));
      }
    }
    walk(p);

    expect(files).toContain('package.json');
    expect(files).toContain(path.join('src', 'index.js'));
    expect(files).toContain(path.join('src', 'utils.js'));
    expect(files.length).toBe(3);
  });

  it('small-project has expected structure for framework detection', () => {
    const p = fixturePath('small-project');

    // Framework detection signals
    const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'));
    expect(pkg.dependencies).toHaveProperty('express');  // Express detection
    expect(pkg.dependencies).toHaveProperty('prisma');    // Prisma detection
    expect(pkg.dependencies).toHaveProperty('jsonwebtoken'); // Auth detection

    // Infrastructure signals
    expect(fs.existsSync(path.join(p, 'Dockerfile'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'prisma/schema.prisma'))).toBe(true);
    expect(fs.existsSync(path.join(p, '.github/workflows/ci.yml'))).toBe(true);

    // Entry point
    expect(fs.existsSync(path.join(p, 'src/app.js'))).toBe(true);

    // Routes (for API surface)
    expect(fs.existsSync(path.join(p, 'src/routes/auth.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/routes/todos.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/routes/users.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/routes/health.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/routes/tags.js'))).toBe(true);

    // Models
    expect(fs.existsSync(path.join(p, 'src/models/user.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/models/todo.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/models/tag.js'))).toBe(true);

    // Middleware
    expect(fs.existsSync(path.join(p, 'src/middleware/auth.js'))).toBe(true);
    expect(fs.existsSync(path.join(p, 'src/middleware/error-handler.js'))).toBe(true);
  });

  it('small-project has correct file count for scanner', () => {
    const p = fixturePath('small-project');
    const files = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(p, full));
      }
    }
    walk(p);

    // Should have ~15 files (not counting node_modules or .git)
    expect(files.length).toBeGreaterThanOrEqual(14);
    expect(files.length).toBeLessThanOrEqual(20);
  });
});
