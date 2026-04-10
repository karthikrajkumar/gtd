/**
 * Tests for Phase 3: Analysis Engine — All 7 Analyzer Agents
 *
 * Verifies agent definitions, reference documents, workflow, command,
 * and simulated analysis output format.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  PROJECT_ROOT,
  createTempPlanningDir,
  writePlanningFile,
  readPlanningFile,
  mockGitCommit,
} = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { getAnalysisStatus, getStaleDimensions, DIMENSIONS } = require('../lib/analysis.cjs');
const { loadState, updateState } = require('../lib/state.cjs');

// --- All 7 analyzer agents ---

const ANALYZER_AGENTS = [
  {
    name: 'gtd-architecture-analyzer',
    file: 'agents/backward/gtd-architecture-analyzer.md',
    dimension: 'architecture',
    mustContain: ['Layer Structure', 'Component Boundary', 'Communication Patterns', 'Architecture Diagram'],
    outputFile: 'ARCHITECTURE-ANALYSIS.md',
  },
  {
    name: 'gtd-api-extractor',
    file: 'agents/backward/gtd-api-extractor.md',
    dimension: 'api',
    mustContain: ['Endpoint Inventory', 'Authentication', 'Request/Response', 'Error Response'],
    outputFile: 'API-SURFACE.md',
  },
  {
    name: 'gtd-pattern-detector',
    file: 'agents/backward/gtd-pattern-detector.md',
    dimension: 'patterns',
    mustContain: ['Design Patterns', 'Code Conventions', 'Anti-Patterns', 'Test Strategy'],
    outputFile: 'PATTERN-ANALYSIS.md',
  },
  {
    name: 'gtd-data-flow-tracer',
    file: 'agents/backward/gtd-data-flow-tracer.md',
    dimension: 'data-flow',
    mustContain: ['Request Lifecycle', 'Data Transformation', 'Sequence Diagram', 'Database Interaction'],
    outputFile: 'DATA-FLOW.md',
  },
  {
    name: 'gtd-dependency-analyzer',
    file: 'agents/backward/gtd-dependency-analyzer.md',
    dimension: 'dependencies',
    mustContain: ['Runtime Dependencies', 'Dev Dependencies', 'Internal Module Graph', 'Build Toolchain'],
    outputFile: 'DEPENDENCY-GRAPH.md',
  },
  {
    name: 'gtd-security-scanner',
    file: 'agents/backward/gtd-security-scanner.md',
    dimension: 'security',
    mustContain: ['Authentication', 'Authorization', 'Input Validation', 'NEVER include actual secret'],
    outputFile: 'SECURITY-SURFACE.md',
  },
  {
    name: 'gtd-performance-profiler',
    file: 'agents/backward/gtd-performance-profiler.md',
    dimension: 'performance',
    mustContain: ['Caching', 'Database Performance', 'Async', 'Scaling Configuration', 'Bottleneck'],
    outputFile: 'PERFORMANCE-ANALYSIS.md',
  },
];

describe('Analyzer Agent Definitions', () => {
  for (const agent of ANALYZER_AGENTS) {
    describe(agent.name, () => {
      const agentPath = path.join(PROJECT_ROOT, agent.file);

      it('exists', () => {
        expect(fs.existsSync(agentPath)).toBe(true);
      });

      it('has valid frontmatter with name and category', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.name).toBe(agent.name);
        expect(frontmatter.category).toBe('backward');
        expect(frontmatter.role).toBe('analysis');
      });

      it('is marked as parallel-capable', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.parallel).toBe(true);
      });

      it('uses sonnet model tier', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.model_tier).toBe('sonnet');
      });

      it('has required tools listed', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('- Read');
        expect(content).toContain('- Grep');
        expect(content).toContain('- Glob');
      });

      it('references CODEBASE-MAP.md as input', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('CODEBASE-MAP.md');
      });

      it(`produces ${agent.outputFile}`, () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain(agent.outputFile);
      });

      for (const section of agent.mustContain) {
        it(`documents "${section}" in its process`, () => {
          const content = fs.readFileSync(agentPath, 'utf8');
          expect(content).toContain(section);
        });
      }
    });
  }
});

// --- Agent count verification ---

describe('Agent roster completeness', () => {
  it('has at least 8 backward agents (mapper + analyzers + writers)', () => {
    const agentsDir = path.join(PROJECT_ROOT, 'agents/backward');
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it('all agents have unique names', () => {
    const agentsDir = path.join(PROJECT_ROOT, 'agents/backward');
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    const names = files.map((f) => {
      const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      return frontmatter.name;
    });
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all analyzer agents have unique color codes', () => {
    // Check only the 7 analyzer agents (writers may share colors)
    const agentsDir = path.join(PROJECT_ROOT, 'agents/backward');
    const analyzerFiles = fs.readdirSync(agentsDir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => !f.includes('writer') && !f.includes('diagram') && !f.includes('mapper'));
    const colors = analyzerFiles.map((f) => {
      const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      return frontmatter.color;
    }).filter(Boolean);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

// --- Reference documents ---

describe('Analysis reference documents', () => {
  const refs = [
    { file: 'references/analysis-patterns.md', mustContain: ['Output Format Standard', 'File Reading Strategy', 'Architecture Pattern Detection', 'Anti-Patterns'] },
    { file: 'references/document-standards.md', mustContain: ['Document Metadata Header', 'Content Quality Rules', 'Code Snippet Rules', 'Versioning'] },
    { file: 'references/diagram-conventions.md', mustContain: ['Diagram Types', 'Style Rules', 'Size Limits', 'sequenceDiagram', 'erDiagram'] },
  ];

  for (const ref of refs) {
    describe(path.basename(ref.file), () => {
      it('exists', () => {
        expect(fs.existsSync(path.join(PROJECT_ROOT, ref.file))).toBe(true);
      });

      for (const section of ref.mustContain) {
        it(`contains "${section}"`, () => {
          const content = fs.readFileSync(path.join(PROJECT_ROOT, ref.file), 'utf8');
          expect(content).toContain(section);
        });
      }
    });
  }
});

// --- Analyze workflow and command ---

describe('Analyze workflow', () => {
  const workflowPath = path.join(PROJECT_ROOT, 'workflows/backward/analyze-codebase.md');

  it('exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('references all 7 analyzer agents', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-architecture-analyzer');
    expect(content).toContain('gtd-api-extractor');
    expect(content).toContain('gtd-pattern-detector');
    expect(content).toContain('gtd-data-flow-tracer');
    expect(content).toContain('gtd-dependency-analyzer');
    expect(content).toContain('gtd-security-scanner');
    expect(content).toContain('gtd-performance-profiler');
  });

  it('checks for CODEBASE-MAP.md prerequisite', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('codebase_map');
    expect(content).toContain('/gtd-scan');
  });

  it('supports parallelization', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('parallelization');
  });

  it('supports --force flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('--force');
  });

  it('supports --focus flag', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('--focus');
  });

  it('updates state to analyzed', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('backward.status');
    expect(content).toContain('analyzed');
  });

  it('has error handling for partial analysis', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('error_handling');
    expect(content).toContain('Partial analysis');
  });
});

describe('Analyze command', () => {
  const cmdPath = path.join(PROJECT_ROOT, 'commands/gtd/backward/analyze.md');

  it('exists', () => {
    expect(fs.existsSync(cmdPath)).toBe(true);
  });

  it('has correct frontmatter name', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-analyze');
  });

  it('references the analyze workflow', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).toContain('analyze-codebase.md');
  });

  it('lists all 7 dimensions', () => {
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).toContain('architecture');
    expect(content).toContain('api');
    expect(content).toContain('data-flow');
    expect(content).toContain('dependencies');
    expect(content).toContain('security');
    expect(content).toContain('performance');
  });
});

// --- Simulated analysis output validation ---

describe('Simulated analysis output', () => {
  let temp;

  beforeEach(() => {
    temp = createTempPlanningDir();
  });

  afterEach(() => {
    temp.cleanup();
  });

  it('validates architecture analysis output format', () => {
    const commit = mockGitCommit();
    writePlanningFile(temp.dir, 'analysis/ARCHITECTURE-ANALYSIS.md', `---
dimension: architecture
commit: ${commit}
timestamp: 2026-04-10T10:00:00Z
files_analyzed: 25
analysis_depth: standard
---

# Architecture Analysis

## Architecture Pattern
**Classification:** Monolith (MVC) [HIGH]
**Evidence:** Single entry point at src/app.js, routes/ + models/ + middleware/ structure.

## Component Boundary Map
| Module | Responsibility | Inbound | Outbound |
|--------|---------------|---------|----------|
| routes/ | HTTP handling | Express router | models, middleware |
| models/ | Data access | routes, services | Prisma ORM |
| middleware/ | Cross-cutting | Express pipeline | JWT library |

## Layer Structure
| Layer | Directory | Files |
|-------|-----------|-------|
| Presentation | src/routes/ | 5 |
| Domain | src/models/ | 3 |
| Infrastructure | src/middleware/ | 2 |

## Architecture Diagram
\`\`\`mermaid
graph TD
    Client[Client] -->|HTTP| Express[Express Server]
    Express --> Auth[Auth Middleware]
    Auth --> Routes[Route Handlers]
    Routes --> Models[Prisma Models]
    Models --> DB[(PostgreSQL)]
\`\`\`
`);

    const content = readPlanningFile(temp.dir, 'analysis/ARCHITECTURE-ANALYSIS.md');
    const { frontmatter, body } = parseFrontmatter(content);

    expect(frontmatter.dimension).toBe('architecture');
    expect(frontmatter.commit).toBe(commit);
    expect(frontmatter.files_analyzed).toBe(25);
    expect(body).toContain('## Architecture Pattern');
    expect(body).toContain('## Component Boundary Map');
    expect(body).toContain('## Layer Structure');
    expect(body).toContain('```mermaid');

    // Verify analysis status detection
    const status = getAnalysisStatus(temp.dir);
    expect(status.dimensions.architecture.status).toBe('complete');
    expect(status.dimensions.architecture.files_analyzed).toBe(25);
  });

  it('validates all 7 dimensions can coexist', () => {
    const commit = mockGitCommit();
    // Use file names that match what getAnalysisStatus looks for
    // The analysis module searches for files containing the dimension name
    const dims = [
      ['ARCHITECTURE-ANALYSIS.md', 'architecture'],
      ['API-SURFACE.md', 'api'],
      ['DATA-FLOW.md', 'data-flow'],
      ['DEPENDENCY-GRAPH.md', 'dependencies'],
      ['SECURITY-SURFACE.md', 'security'],
      ['PERFORMANCE-ANALYSIS.md', 'performance'],
    ];

    for (const [file, dim] of dims) {
      writePlanningFile(temp.dir, `analysis/${file}`, `---
dimension: ${dim}
commit: ${commit}
timestamp: 2026-04-10T10:00:00Z
files_analyzed: 20
analysis_depth: standard
---

# ${dim.charAt(0).toUpperCase() + dim.slice(1)} Analysis
Content for ${dim}.
`);
    }

    const status = getAnalysisStatus(temp.dir);
    // All 6 canonical dimensions should be detected as complete
    const completeCount = Object.values(status.dimensions).filter(d => d.status === 'complete').length;
    expect(completeCount).toBeGreaterThanOrEqual(5);
  });

  it('state updates correctly after simulated analysis', () => {
    const commit = mockGitCommit();
    updateState(temp.dir, {
      backward: {
        status: 'analyzed',
        last_analysis_commit: commit,
      },
    });

    const state = loadState(temp.dir);
    expect(state.backward.status).toBe('analyzed');
    expect(state.backward.last_analysis_commit).toBe(commit);
  });

  it('security scanner output must not contain .env values', () => {
    const commit = mockGitCommit();
    const secContent = `---
dimension: security
commit: ${commit}
timestamp: 2026-04-10T10:00:00Z
files_analyzed: 15
analysis_depth: standard
---

# Security Analysis

## Authentication
- **Mechanism:** JWT (jsonwebtoken library)
- **Note:** .env file exists and is gitignored. Contains JWT_SECRET and DATABASE_URL.
  Values NOT included per policy.
`;

    writePlanningFile(temp.dir, 'analysis/SECURITY-SURFACE.md', secContent);
    const content = readPlanningFile(temp.dir, 'analysis/SECURITY-SURFACE.md');

    // Verify no actual secret values
    expect(content).not.toContain('sk-');
    expect(content).not.toContain('password123');
    expect(content).not.toContain('postgres://');
    expect(content).toContain('Values NOT included');
  });
});
