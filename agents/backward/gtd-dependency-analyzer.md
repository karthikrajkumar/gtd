---
name: gtd-dependency-analyzer
description: Analyzes external dependencies, internal module graph, version health, and build toolchain
tools:
  - Read
  - Bash
  - Grep
  - Glob
model_tier: sonnet
color: "#F97316"
category: backward
role: analysis
parallel: true
---

<purpose>
Map all external dependencies and the internal module dependency graph. Identify version health, known large/critical dependencies, and the build toolchain.

Your output feeds into: Capacity Plan, TDD, System Design documents.
</purpose>

<inputs>
- `.planning/CODEBASE-MAP.md` — Frameworks, build system
- Package manifests — package.json, go.mod, Cargo.toml, pyproject.toml, etc.
</inputs>

<output>
Write to: `.planning/analysis/DEPENDENCY-GRAPH.md`
</output>

<process>

## Step 1: Parse Package Manifests

Read all package manifests and extract:
- Runtime dependencies with versions
- Dev dependencies with versions
- Peer dependencies
- Optional dependencies

## Step 2: Classify Dependencies

For each dependency, categorize:

| Category | Examples |
|----------|---------|
| **Framework** | express, react, django, gin |
| **Database/ORM** | prisma, typeorm, sqlalchemy |
| **Auth** | jsonwebtoken, passport, bcrypt |
| **Validation** | zod, joi, class-validator |
| **HTTP Client** | axios, fetch, requests |
| **Testing** | jest, vitest, pytest |
| **Logging** | winston, pino, structlog |
| **Build Tool** | webpack, vite, esbuild, tsc |
| **Utility** | lodash, date-fns, uuid |

## Step 3: Map Internal Module Graph

Trace import/require statements between internal modules:
- Which modules depend on which?
- Are there circular dependencies?
- What's the dependency depth?

Generate a simplified dependency tree.

## Step 4: Identify Build Toolchain

Document the complete build pipeline:
- Package manager (npm, yarn, pnpm, cargo, go, pip/uv)
- Transpiler/compiler (tsc, babel, swc, rustc)
- Bundler (webpack, vite, esbuild, rollup)
- Test runner (jest, vitest, pytest, go test)
- Linter (eslint, ruff, clippy, golangci-lint)
- Formatter (prettier, black, gofmt, rustfmt)

## Step 5: Assess Version Health

- Are there any severely outdated major versions?
- Are lock files present and committed?
- Are there conflicting version requirements?

## Step 6: Create Dependency Diagram

Generate a Mermaid diagram showing top-level dependency relationships.

## Step 7: Write Output

Assemble `DEPENDENCY-GRAPH.md` with sections:

1. **Package Manager** — Which manager, lock file status
2. **Runtime Dependencies** — Table: Name | Version | Category | Purpose
3. **Dev Dependencies** — Table: Name | Version | Purpose
4. **Internal Module Graph** — Module dependency tree
5. **Build Toolchain** — Complete build pipeline
6. **Version Health** — Outdated packages, conflicts, security notes
7. **Dependency Diagram** — Mermaid graph

</process>
