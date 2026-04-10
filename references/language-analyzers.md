# Language Analyzers Reference

> Language-specific conventions for codebase analysis.
> Used by `gtd-codebase-mapper` and all analyzer agents.

---

## Language Detection

### By File Extension

| Extension | Language | Confidence |
|-----------|----------|------------|
| `.ts`, `.tsx` | TypeScript | 95% |
| `.js`, `.jsx`, `.mjs`, `.cjs` | JavaScript | 95% |
| `.py`, `.pyw` | Python | 95% |
| `.go` | Go | 95% |
| `.rs` | Rust | 95% |
| `.java` | Java | 95% |
| `.kt`, `.kts` | Kotlin | 95% |
| `.rb` | Ruby | 95% |
| `.cs` | C# | 95% |
| `.php` | PHP | 95% |
| `.swift` | Swift | 95% |
| `.sql` | SQL | 90% |
| `.sh`, `.bash` | Shell | 90% |
| `.yml`, `.yaml` | YAML | 80% |
| `.json` | JSON | 80% |
| `.md` | Markdown | 80% |
| `.html`, `.htm` | HTML | 85% |
| `.css`, `.scss`, `.sass`, `.less` | CSS | 90% |

### By Package Manifest

| File | Language Confirmation |
|------|---------------------|
| `package.json` | JavaScript/TypeScript |
| `tsconfig.json` | TypeScript (over JS) |
| `pyproject.toml`, `setup.py`, `requirements.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml`, `build.gradle`, `build.gradle.kts` | Java/Kotlin |
| `Gemfile` | Ruby |
| `*.csproj`, `*.sln` | C# |
| `composer.json` | PHP |
| `Package.swift` | Swift |

---

## Entry Point Conventions

### JavaScript / TypeScript
```
Primary:
  - package.json → "main" field
  - package.json → "module" field
  - src/index.ts, src/index.js
  - src/main.ts, src/main.js
  - index.ts, index.js

Web:
  - src/app/layout.tsx (Next.js App Router)
  - src/pages/_app.tsx (Next.js Pages Router)
  - src/App.tsx (React CRA/Vite)
  - src/main.tsx (Vite)

API:
  - src/app.ts, src/app.js (Express/Fastify)
  - src/server.ts, src/server.js

CLI:
  - package.json → "bin" field
  - bin/*.js
```

### Python
```
Primary:
  - main.py, app.py
  - src/main.py, src/app.py
  - __main__.py

Web:
  - manage.py (Django)
  - app.py, main.py with FastAPI()/Flask(__name__)

Worker:
  - celery.py, tasks.py
  - worker.py
```

### Go
```
Primary:
  - main.go (at package root)
  - cmd/*/main.go (multi-binary)
  - cmd/server/main.go

Convention:
  - cmd/ → entry points
  - internal/ → private packages
  - pkg/ → public packages
```

### Rust
```
Primary:
  - src/main.rs (binary)
  - src/lib.rs (library)

Convention:
  - src/bin/*.rs → additional binaries
  - Cargo.toml → [[bin]] sections
```

### Java / Kotlin
```
Primary:
  - @SpringBootApplication annotated class
  - public static void main(String[] args)
  - src/main/java/**/*Application.java

Convention:
  - src/main/ → production code
  - src/test/ → test code
```

### Ruby
```
Primary:
  - config.ru (Rack apps)
  - bin/rails (Rails)
  - app.rb (Sinatra)
```

---

## Module Boundary Conventions

### JavaScript / TypeScript
```
Monorepo workspaces:
  - package.json → "workspaces" field
  - packages/*/package.json
  - apps/*/package.json
  - pnpm-workspace.yaml
  - turbo.json, nx.json

Single project modules:
  - src/modules/*/
  - src/features/*/
  - src/domains/*/
  - Top-level directories under src/
```

### Python
```
Packages:
  - Directories with __init__.py
  - pyproject.toml → [tool.poetry.packages]
  - src/ layout (src/mypackage/)

Monorepo:
  - Multiple pyproject.toml files
  - Multiple setup.py files
```

### Go
```
Module boundary:
  - go.mod defines the module
  - Top-level directories = packages
  - internal/ = private to module
  - cmd/ = binary entry points
```

---

## Test Conventions

| Language | Test Location | Test Pattern | Runner |
|----------|--------------|--------------|--------|
| JS/TS | `__tests__/`, `*.test.ts`, `*.spec.ts`, `tests/` | `describe`/`it`/`test` | Jest, Vitest, Mocha |
| Python | `tests/`, `test_*.py`, `*_test.py` | `def test_`, `class Test` | pytest, unittest |
| Go | `*_test.go` (same directory) | `func Test*` | `go test` |
| Rust | `#[cfg(test)] mod tests`, `tests/` | `#[test] fn` | `cargo test` |
| Java | `src/test/`, `*Test.java` | `@Test` | JUnit, TestNG |
| Ruby | `spec/`, `test/`, `*_spec.rb`, `*_test.rb` | `describe`/`it` | RSpec, Minitest |

---

## Configuration File Conventions

### Environment
```
.env, .env.local, .env.production, .env.development
⚠ NEVER include in analysis output — these may contain secrets.
Only note their EXISTENCE and which variables are referenced.
```

### Build Configuration
| File | Tool |
|------|------|
| `webpack.config.*` | Webpack |
| `vite.config.*` | Vite |
| `turbopack.json` | Turbopack |
| `rollup.config.*` | Rollup |
| `esbuild.*` | esbuild |
| `tsconfig.json` | TypeScript compiler |
| `babel.config.*`, `.babelrc` | Babel |
| `Makefile` | Make |
| `CMakeLists.txt` | CMake |

### Linting / Formatting
| File | Tool |
|------|------|
| `.eslintrc*`, `eslint.config.*` | ESLint |
| `.prettierrc*` | Prettier |
| `pyproject.toml` → `[tool.ruff]` | Ruff |
| `pyproject.toml` → `[tool.black]` | Black |
| `.golangci.yml` | golangci-lint |
| `rustfmt.toml` | rustfmt |
| `Cargo.clippy.toml` | Clippy |

---

*End of Language Analyzers Reference*
