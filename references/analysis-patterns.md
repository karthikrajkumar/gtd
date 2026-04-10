# Analysis Patterns Reference

> Shared heuristics and methodology for all analyzer agents.
> Every analyzer MUST follow these patterns for consistent output.

---

## Output Format Standard

Every analysis artifact MUST:

1. **Have YAML frontmatter** with these fields:
```yaml
---
dimension: <dimension-name>
commit: <git short hash>
timestamp: <ISO 8601>
files_analyzed: <count>
analysis_depth: <shallow|standard|deep>
---
```

2. **Use Markdown with structured sections** matching the dimension
3. **Include Mermaid diagrams** where visual representation adds clarity
4. **Reference actual file paths** — never fabricate paths
5. **Mark confidence levels** on uncertain claims:
   - `[HIGH]` — Directly observed in code
   - `[MEDIUM]` — Inferred from patterns and conventions
   - `[LOW]` — Best guess, may need verification

---

## File Reading Strategy

### Priority Order
When context budget is limited, read files in this priority:

1. **Entry points** — main/index files, app bootstrap
2. **Configuration** — package.json, tsconfig, framework configs
3. **Route/Controller files** — API surface definition
4. **Core domain files** — Models, services, business logic
5. **Middleware/Interceptors** — Cross-cutting behavior
6. **Utilities/Helpers** — Shared functions
7. **Tests** — Only if `include_tests` is true

### File Selection Heuristic
```
score(file) = 
  + 10 if entry_point
  + 8  if route/controller/handler
  + 7  if model/entity/schema
  + 6  if service/use_case
  + 5  if middleware/interceptor
  + 4  if config file
  + 3  if utility/helper
  + 2  if type definition
  + 1  if test file (only if include_tests)
  - 3  if generated file (dist/, .next/, __pycache__/)
  - 5  if lock file or binary
```

Read top N files by score, where N is determined by analysis depth.

---

## Architecture Pattern Detection

### Pattern Indicators

| Pattern | Key Indicators |
|---------|---------------|
| **Monolith** | Single entry point, shared database, no service boundaries |
| **Modular Monolith** | Single deploy unit, but clear module boundaries with defined interfaces |
| **Microservices** | Multiple entry points, separate databases, docker-compose with 3+ services |
| **Monorepo** | workspace config, multiple package.json, apps/ + packages/ structure |
| **Event-Driven** | Message queue deps (kafka, rabbitmq, redis pub/sub), event handler patterns |
| **Serverless** | serverless.yml, Lambda handler patterns, API Gateway config |
| **MVC** | controllers/ + models/ + views/ directories |
| **Clean Architecture** | domain/ + application/ + infrastructure/ layers |
| **Hexagonal** | ports/ + adapters/ pattern |
| **CQRS** | Separate read/write models, command/query handlers |

### Layer Classification

When classifying code into layers, use:

| Layer | Typical Locations | Responsibility |
|-------|-------------------|---------------|
| **Presentation** | routes/, controllers/, pages/, components/ | HTTP handling, UI rendering |
| **Application** | services/, use-cases/, handlers/ | Business orchestration |
| **Domain** | models/, entities/, domain/, core/ | Business rules, entities |
| **Infrastructure** | repositories/, db/, config/, middleware/ | External system integration |
| **Shared** | utils/, helpers/, lib/, common/ | Cross-cutting utilities |

---

## Communication Pattern Detection

| Pattern | Detection Signals |
|---------|------------------|
| **REST** | Express routes, FastAPI endpoints, Spring @GetMapping |
| **GraphQL** | graphql deps, schema.graphql, resolvers/, type defs |
| **gRPC** | .proto files, grpc deps, generated code |
| **WebSocket** | socket.io, ws deps, WebSocket handler code |
| **Message Queue** | kafka, rabbitmq, bull, celery deps and config |
| **Event Bus** | EventEmitter patterns, custom event dispatchers |
| **Cron/Scheduled** | node-cron, schedule deps, crontab patterns |

---

## Diagram Standards

All Mermaid diagrams must:
- Use `graph TD` (top-down) for hierarchies and component diagrams
- Use `sequenceDiagram` for request flows and interactions
- Use `erDiagram` for data models
- Use `flowchart LR` (left-right) for pipeline/process flows
- Include labels on all edges
- Limit to 15 nodes maximum per diagram (split into multiple if larger)

---

## Anti-Patterns to Flag

When encountered, note these in the analysis:

| Anti-Pattern | Signal | Severity |
|-------------|--------|----------|
| God Object | Class/module with 500+ lines, 20+ methods | Medium |
| Circular Dependency | A imports B imports A | High |
| Hardcoded Secrets | Literal API keys, passwords in source | Critical |
| No Error Handling | catch blocks that swallow errors silently | Medium |
| N+1 Query | Loop with DB call inside | High |
| Mixed Concerns | Route handler with business logic + DB queries | Medium |

---

*End of Analysis Patterns Reference*
