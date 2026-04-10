# Framework Signatures Reference

> Detection patterns for 35+ frameworks across 8 languages.
> Used by `gtd-codebase-mapper` during `/gtd-scan`.

---

## Detection Methodology

Each framework is identified by **multiple signals** with confidence scores:
- **Manifest match** (90%): Framework appears in dependency list
- **Config file match** (85%): Framework-specific config file exists
- **Directory pattern match** (70%): Conventional directory structure found
- **Code pattern match** (65%): Import/usage patterns in source code

Final confidence = highest single signal (not additive). Multiple signals increase certainty but don't stack scores.

---

## JavaScript / TypeScript

### Next.js
```yaml
indicators:
  - type: dependency
    key: "next"
    confidence: 90
  - type: config_file
    pattern: "next.config.*"
    confidence: 85
  - type: directory
    pattern: "app/"
    with_file: "layout.tsx|layout.js"
    confidence: 80
  - type: directory
    pattern: "pages/"
    with_file: "index.tsx|index.js|_app.tsx"
    confidence: 75
architecture: "SSR/SSG + API Routes"
category: "fullstack"
```

### React (Create React App / Vite)
```yaml
indicators:
  - type: dependency
    key: "react"
    confidence: 80
  - type: dependency
    key: "react-dom"
    confidence: 85
  - type: config_file
    pattern: "vite.config.*"
    with_dependency: "react"
    confidence: 85
  - type: file
    pattern: "src/App.tsx|src/App.jsx"
    confidence: 70
architecture: "SPA"
category: "frontend"
```

### Vue.js / Nuxt
```yaml
indicators:
  - type: dependency
    key: "vue"
    confidence: 85
  - type: dependency
    key: "nuxt"
    confidence: 90
  - type: config_file
    pattern: "nuxt.config.*"
    confidence: 90
  - type: config_file
    pattern: "vue.config.*"
    confidence: 85
architecture: "SPA|SSR"
category: "frontend|fullstack"
```

### Angular
```yaml
indicators:
  - type: dependency
    key: "@angular/core"
    confidence: 95
  - type: config_file
    pattern: "angular.json"
    confidence: 95
  - type: directory
    pattern: "src/app/"
    with_file: "app.module.ts|app.component.ts"
    confidence: 80
architecture: "SPA"
category: "frontend"
```

### Svelte / SvelteKit
```yaml
indicators:
  - type: dependency
    key: "svelte"
    confidence: 85
  - type: dependency
    key: "@sveltejs/kit"
    confidence: 90
  - type: config_file
    pattern: "svelte.config.*"
    confidence: 90
architecture: "SPA|SSR"
category: "frontend|fullstack"
```

### Express.js
```yaml
indicators:
  - type: dependency
    key: "express"
    confidence: 90
  - type: code_pattern
    pattern: "require\\(['\"]express['\"]\\)|from ['\"]express['\"]"
    confidence: 80
  - type: code_pattern
    pattern: "app\\.get\\(|app\\.post\\(|app\\.use\\(|router\\."
    confidence: 70
architecture: "REST API with middleware"
category: "backend"
```

### Fastify
```yaml
indicators:
  - type: dependency
    key: "fastify"
    confidence: 90
  - type: code_pattern
    pattern: "require\\(['\"]fastify['\"]\\)|from ['\"]fastify['\"]"
    confidence: 80
architecture: "REST API"
category: "backend"
```

### NestJS
```yaml
indicators:
  - type: dependency
    key: "@nestjs/core"
    confidence: 95
  - type: config_file
    pattern: "nest-cli.json"
    confidence: 90
  - type: code_pattern
    pattern: "@Controller\\(|@Injectable\\(|@Module\\("
    confidence: 85
architecture: "Modular REST/GraphQL API"
category: "backend"
```

### Hono
```yaml
indicators:
  - type: dependency
    key: "hono"
    confidence: 90
architecture: "Edge-first REST API"
category: "backend"
```

### Electron
```yaml
indicators:
  - type: dependency
    key: "electron"
    confidence: 95
  - type: file
    pattern: "main.js|electron-main.*"
    with_dependency: "electron"
    confidence: 80
architecture: "Desktop application"
category: "desktop"
```

### React Native / Expo
```yaml
indicators:
  - type: dependency
    key: "react-native"
    confidence: 90
  - type: dependency
    key: "expo"
    confidence: 90
  - type: config_file
    pattern: "app.json"
    with_key: "expo"
    confidence: 85
architecture: "Mobile application"
category: "mobile"
```

---

## Python

### Django
```yaml
indicators:
  - type: dependency
    key: "django"
    confidence: 95
  - type: file
    pattern: "manage.py"
    confidence: 85
  - type: file
    pattern: "settings.py|settings/"
    confidence: 75
  - type: code_pattern
    pattern: "from django|import django"
    confidence: 80
architecture: "MVC (MTV) web framework"
category: "fullstack"
```

### FastAPI
```yaml
indicators:
  - type: dependency
    key: "fastapi"
    confidence: 95
  - type: code_pattern
    pattern: "from fastapi import|FastAPI\\(\\)"
    confidence: 85
  - type: code_pattern
    pattern: "@app\\.get\\(|@app\\.post\\(|@router\\."
    confidence: 75
architecture: "Async REST API"
category: "backend"
```

### Flask
```yaml
indicators:
  - type: dependency
    key: "flask"
    confidence: 90
  - type: code_pattern
    pattern: "from flask import|Flask\\(__name__\\)"
    confidence: 80
architecture: "Micro REST API"
category: "backend"
```

### Celery
```yaml
indicators:
  - type: dependency
    key: "celery"
    confidence: 90
  - type: file
    pattern: "celery.py|celeryconfig.py|tasks.py"
    confidence: 75
architecture: "Distributed task queue"
category: "worker"
```

---

## Go

### Gin
```yaml
indicators:
  - type: dependency
    key: "github.com/gin-gonic/gin"
    confidence: 95
  - type: code_pattern
    pattern: "gin\\.Default\\(\\)|gin\\.New\\(\\)"
    confidence: 85
architecture: "REST API"
category: "backend"
```

### Echo
```yaml
indicators:
  - type: dependency
    key: "github.com/labstack/echo"
    confidence: 95
architecture: "REST API"
category: "backend"
```

### Fiber
```yaml
indicators:
  - type: dependency
    key: "github.com/gofiber/fiber"
    confidence: 95
architecture: "REST API"
category: "backend"
```

### Chi
```yaml
indicators:
  - type: dependency
    key: "github.com/go-chi/chi"
    confidence: 95
architecture: "REST API"
category: "backend"
```

### Go Standard Library Server
```yaml
indicators:
  - type: code_pattern
    pattern: "net/http"
    with_pattern: "http\\.ListenAndServe|http\\.Handle"
    confidence: 70
architecture: "REST API (stdlib)"
category: "backend"
```

---

## Rust

### Actix-web
```yaml
indicators:
  - type: dependency
    key: "actix-web"
    confidence: 95
architecture: "REST API"
category: "backend"
```

### Axum
```yaml
indicators:
  - type: dependency
    key: "axum"
    confidence: 95
architecture: "REST API"
category: "backend"
```

### Rocket
```yaml
indicators:
  - type: dependency
    key: "rocket"
    confidence: 95
architecture: "REST API"
category: "backend"
```

---

## Java / Kotlin

### Spring Boot
```yaml
indicators:
  - type: dependency
    key: "org.springframework.boot"
    confidence: 95
  - type: code_pattern
    pattern: "@SpringBootApplication|@RestController|@GetMapping"
    confidence: 85
  - type: file
    pattern: "application.properties|application.yml"
    confidence: 75
architecture: "Enterprise REST/MVC"
category: "backend"
```

### Quarkus
```yaml
indicators:
  - type: dependency
    key: "io.quarkus"
    confidence: 95
architecture: "Cloud-native REST API"
category: "backend"
```

---

## Ruby

### Rails
```yaml
indicators:
  - type: dependency
    key: "rails"
    confidence: 95
  - type: file
    pattern: "config/routes.rb"
    confidence: 90
  - type: directory
    pattern: "app/controllers"
    confidence: 80
architecture: "MVC web framework"
category: "fullstack"
```

### Sinatra
```yaml
indicators:
  - type: dependency
    key: "sinatra"
    confidence: 90
architecture: "Micro REST API"
category: "backend"
```

---

## Infrastructure

### Docker
```yaml
indicators:
  - type: file
    pattern: "Dockerfile"
    confidence: 95
  - type: file
    pattern: "docker-compose.yml|docker-compose.yaml|compose.yml|compose.yaml"
    confidence: 95
  - type: file
    pattern: ".dockerignore"
    confidence: 70
category: "containerization"
```

### Kubernetes
```yaml
indicators:
  - type: directory
    pattern: "k8s/|kubernetes/|charts/|helm/"
    confidence: 85
  - type: code_pattern
    file_pattern: "*.yaml|*.yml"
    pattern: "apiVersion:|kind: Deployment|kind: Service"
    confidence: 80
category: "orchestration"
```

### Terraform
```yaml
indicators:
  - type: file
    pattern: "*.tf"
    confidence: 90
  - type: file
    pattern: "terraform.tfstate|.terraform/"
    confidence: 85
category: "infrastructure-as-code"
```

### Pulumi
```yaml
indicators:
  - type: file
    pattern: "Pulumi.yaml|Pulumi.yml"
    confidence: 95
category: "infrastructure-as-code"
```

---

## CI/CD

### GitHub Actions
```yaml
indicators:
  - type: directory
    pattern: ".github/workflows/"
    with_file: "*.yml|*.yaml"
    confidence: 95
category: "ci-cd"
```

### GitLab CI
```yaml
indicators:
  - type: file
    pattern: ".gitlab-ci.yml"
    confidence: 95
category: "ci-cd"
```

### CircleCI
```yaml
indicators:
  - type: file
    pattern: ".circleci/config.yml"
    confidence: 95
category: "ci-cd"
```

### Jenkins
```yaml
indicators:
  - type: file
    pattern: "Jenkinsfile"
    confidence: 95
category: "ci-cd"
```

---

## ORM / Database

### Prisma
```yaml
indicators:
  - type: dependency
    key: "prisma|@prisma/client"
    confidence: 95
  - type: file
    pattern: "prisma/schema.prisma"
    confidence: 95
category: "orm"
database: "PostgreSQL|MySQL|SQLite|MongoDB"
```

### Drizzle
```yaml
indicators:
  - type: dependency
    key: "drizzle-orm"
    confidence: 95
  - type: config_file
    pattern: "drizzle.config.*"
    confidence: 90
category: "orm"
```

### TypeORM
```yaml
indicators:
  - type: dependency
    key: "typeorm"
    confidence: 95
category: "orm"
```

### Sequelize
```yaml
indicators:
  - type: dependency
    key: "sequelize"
    confidence: 95
category: "orm"
```

### SQLAlchemy
```yaml
indicators:
  - type: dependency
    key: "sqlalchemy"
    confidence: 95
category: "orm"
database: "PostgreSQL|MySQL|SQLite"
```

### GORM (Go)
```yaml
indicators:
  - type: dependency
    key: "gorm.io/gorm"
    confidence: 95
category: "orm"
```

---

## CSS / Styling

### Tailwind CSS
```yaml
indicators:
  - type: dependency
    key: "tailwindcss"
    confidence: 90
  - type: config_file
    pattern: "tailwind.config.*"
    confidence: 90
category: "styling"
```

### shadcn/ui
```yaml
indicators:
  - type: file
    pattern: "components.json"
    with_key: "style"
    confidence: 80
  - type: directory
    pattern: "components/ui/"
    confidence: 75
category: "component-library"
```

---

*End of Framework Signatures Reference*
