# AI Agents Guide for ADSP Core Services

This document provides guidance for AI assistants working in the Alberta Digital Service Platform (ADSP) monorepo. Use this as your primary reference for understanding the project structure, conventions, and best practices.

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture Fundamentals](#architecture-fundamentals)
- [Repository Structure](#repository-structure)
- [Development Guidelines](#development-guidelines)
- [Service Development Patterns](#service-development-patterns)
- [Testing Standards](#testing-standards)
- [Common Tasks](#common-tasks)
- [Quality Checklist](#quality-checklist)
- [Quick Reference](#quick-reference)
- [AI Assistant Tips](#ai-assistant-tips)

---

## Project Overview

**ADSP** is a multi-tenant platform of microservices providing reusable capabilities to help Alberta government product teams deliver faster. The monorepo uses [Nx](https://nx.dev) for build orchestration.

### Key Concepts
- **Multi-tenancy**: All services support tenant-scoped and Core (System) context requests
- **Service Discovery**: Directory service maps URNs to URLs (e.g., `urn:ads:platform:tenant-service:v2`)
- **Configuration Management**: Services register configuration on startup
- **Domain Events**: RabbitMQ-based event routing with event logging

### Technology Stack
| Layer | Technologies |
|-------|-------------|
| Backend Services | Node.js (Express), .NET, Python (Django/Flask), Java (Spring) |
| Frontend Apps | React, TypeScript |
| Build System | Nx, Webpack |
| Testing | Jest, Cypress |
| Message Queue | RabbitMQ |
| Authentication | Keycloak (OIDC/JWT) |

---

## Architecture Fundamentals

### URN Convention
Platform services follow this URN pattern:
```
urn:ads:<namespace>:<service>:<api>:<resource>
```

- `<namespace>`: `platform` for platform services, tenant name (kebab-case) for tenant services
- `<service>`: Service name in kebab-case (e.g., `tenant-service`)
- `<api>`: Usually API version (e.g., `v2`)
- `<resource>`: API resource subpath (e.g., `/tenants`)

### Multi-tenancy Implementation
- Services use JWT bearer tokens with tenant issuer for context
- Tenant isolation is at the record level (shared database, tenant ID on records)
- Platform service accounts can specify tenant context explicitly

### Domain Events
- Sent via Event service API
- Routed over RabbitMQ
- Push service provides WebSocket gateway for tenant applications

---

## Repository Structure

```
core-services/
├── apps/                    # Applications (services and frontends)
│   ├── *-service/          # Backend microservices (Node.js)
│   ├── *-app/              # Frontend applications (React)
│   ├── *-app-e2e/          # E2E test projects
│   └── *-gateway/          # API gateways
├── libs/                    # Shared libraries
│   ├── adsp-service-sdk/   # Node.js SDK for services
│   ├── adsp-service-*-sdk/ # SDKs for other languages
│   ├── core-common/        # Core shared utilities
│   ├── app-common/         # Frontend shared components
│   └── *-common/           # Domain-specific shared code
├── docs/                    # GitHub Pages documentation
│   ├── services/           # Service-specific docs
│   ├── platform/           # Platform documentation
│   └── tutorials/          # How-to guides
├── tests/                   # Integration and load tests
├── tools/                   # Build and utility scripts
└── samples/                 # Example implementations
```

### Service Structure (Node.js)
```
apps/<service-name>/
├── src/
│   ├── main.ts             # Entry point
│   ├── <domain>/           # Domain modules
│   │   ├── index.ts        # Module exports
│   │   ├── model/          # Domain models
│   │   ├── router.ts       # Express routes
│   │   ├── events.ts       # Domain events
│   │   └── types.ts        # TypeScript types
│   └── environments/       # Environment configs
├── project.json            # Nx project configuration
├── jest.config.ts          # Test configuration
├── tsconfig.*.json         # TypeScript configs
└── webpack.config.js       # Build configuration
```

---

## Development Guidelines

### Nx Build System

Nx CLI is installed local to the project. Use `npx` to run `nx` cli commands.

> **📚 Full Nx reference**: See [.github/agents/nx.md](.github/agents/nx.md) for comprehensive Nx commands, troubleshooting, and best practices.

**Quick commands:**
```bash
nx build <project-name>        # Build a project
nx serve <service-name>        # Serve locally with hot reload
nx test <project-name>         # Run tests
nx affected -t test            # Test only changed projects
nx show projects               # List all projects
nx show project <name>         # View project details and targets
```

**ADSP-specific notes:**
- **Multi-language workspace**: This repo includes Node.js, .NET, Python, and Spring Boot projects via Nx plugins (`@nx-dotnet/core`, `@nxlv/python`, `@nxrocks/nx-spring-boot`)
- **Custom targets**: Libraries like `adsp-service-sdk` have a `release` target for semantic-release publishing
- **58+ projects**: Use `nx show projects --pattern "*-service"` to filter
- **Workspace plugins** Use `nx list workspace-plugin` to list workspace specific generators

### Code Style
- **TypeScript**: Use strict mode, prefer interfaces over types for public APIs
- **Naming**: kebab-case for files/folders, PascalCase for types/classes, camelCase for functions/variables
- **Exports**: Use barrel exports (`index.ts`) for public APIs
- **Error Handling**: Use domain-specific error types extending base errors

### Commit Conventions
This repository uses [Conventional Commits](https://www.conventionalcommits.org/) and semantic-release for automated library publishing.

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature (triggers minor version bump)
- `fix`: Bug fix (triggers patch version bump)
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies

**Breaking Changes**: Include `BREAKING CHANGE:` in the commit footer to trigger a major version bump:
```
feat(adsp-service-sdk): change initialization API

BREAKING CHANGE: initializePlatform now requires serviceId as AdspId instead of string
```

**Scope**: Use the project name for library changes (e.g., `adsp-service-sdk`, `core-common`) to ensure proper release triggers.

**Examples**:
```bash
feat(form-service): add draft form submission endpoint
fix(adsp-service-sdk): resolve token refresh race condition
docs(event-service): update API documentation for v2 endpoints
refactor(tenant-management-api): extract tenant resolution middleware
```

### SDK Usage
When building services, leverage the `adsp-service-sdk`:

```typescript
import { 
  AdspId, 
  initializePlatform, 
  ServiceDirectory 
} from '@abgov/adsp-service-sdk';

// Initialize platform connection
const { 
  directory, 
  tenantService, 
  configurationHandler 
} = await initializePlatform({
  serviceId: AdspId.parse('urn:ads:platform:my-service'),
  // ... other options
});
```

---

## Service Development Patterns

### Creating a New Service

1. **Generate project**: Use Nx generators or copy existing service structure
2. **Define domain model**: Create types and interfaces in `model/`
3. **Implement router**: Express routes with proper error handling
4. **Register configuration**: Define service configuration schema
5. **Add domain events**: Define and signal events for significant operations
6. **Write tests**: Unit tests for business logic, integration tests for APIs

### API Design
- Follow REST conventions
- Version APIs in URL path (`/api/service/v2/...`)
- Use consistent error response format
- Document with OpenAPI/Swagger

### Configuration Registration
Services register their configuration on startup:

```typescript
// Register file types, notification templates, event definitions, etc.
await configurationService.patchConfiguration(
  serviceId,
  configurationSchema,
  defaultConfiguration
);
```

---

## Testing Standards

### Unit Tests
- Co-locate with source files (`*.spec.ts`)
- Mock external dependencies
- Test business logic, edge cases, error handling

```bash
# Run tests for a specific service
nx test status-service

# Run with coverage
nx test status-service --coverage
```

### E2E Tests
- Located in `*-e2e/` projects
- Use Cypress for frontend apps
- Test critical user journeys

### Integration Tests
- Located in `tests/` folder
- Test service interactions
- Include load testing configs

---

## Common Tasks

### Adding a New API Endpoint

1. Define types in `types.ts`
2. Add route handler in `router.ts`
3. Add business logic (repository, service layer)
4. Write unit tests
5. Update OpenAPI documentation
6. Test locally with `nx serve`

### Adding a Domain Event

1. Define event in `events.ts` with namespace and name
2. Register event definition with Event service
3. Signal event from business logic
4. Add event to documentation

### Updating Documentation

Documentation is in `docs/` using Jekyll for GitHub Pages:
- Service docs: `docs/services/<service>.md`
- Platform docs: `docs/platform/`
- Update `_config.yml` for navigation changes

---

## Quality Checklist

Before completing any task, verify:

### Code Quality
- [ ] TypeScript compiles without errors (`nx build <project>`)
- [ ] Linting passes (`nx lint <project>`)
- [ ] Unit tests pass (`nx test <project>`)
- [ ] No hardcoded secrets or environment-specific values

### API Changes
- [ ] Backward compatible (or documented breaking change)
- [ ] OpenAPI documentation updated
- [ ] Error responses follow standard format
- [ ] Proper HTTP status codes used

### New Features
- [ ] Configuration is tenant-scoped appropriately
- [ ] Domain events signal significant state changes
- [ ] Logging follows existing patterns
- [ ] Permissions/roles defined if needed

### Documentation
- [ ] README updated if needed
- [ ] Service documentation in `docs/services/` updated
- [ ] Code comments for complex logic

---

## Quick Reference

### Key Services

These foundational services form the core of ADSP and are dependencies for other platform services:

| Service | Description |
|---------|-------------|
| tenant-management-api | Foundation for multi-tenancy (implements `tenant-service`). Maintains the registry of tenants and maps each to a Keycloak realm (JWT issuer). All other services use this to resolve tenant context from request tokens. Exposed as `urn:ads:platform:tenant-service`. |
| directory-service | Service discovery. Maps logical URNs to service URLs, allowing clients to find capabilities without hardcoding endpoints. Essential for environment portability. |
| configuration-service | Configuration management. Provides tenant-scoped configuration storage and retrieval. Services register their configuration schemas here on startup. |
| event-service | Domain event routing and logging. Receives events via API, routes them over RabbitMQ, and maintains the event log for audit trails. |
| push-service | WebSocket gateway for tenant applications. Subscribes to domain events and pushes them to connected clients in real-time. |

Other services (form-service, file-service, notification-service, status-service, etc.) build on these foundations to provide higher-level capabilities. See `docs/services/` for complete documentation.

### Environment Variables
Services typically need:
- `KEYCLOAK_ROOT_URL`: Keycloak server URL
- `DIRECTORY_URL`: Directory service URL
- `MONGO_URI` / `POSTGRES_*`: Database connection
- `RABBITMQ_*`: Message queue connection

### Useful Links
- [ADSP Development Guide](https://govalta.github.io/adsp-monorepo)
- [Deployment Guide](https://govalta.github.io/adsp-monorepo/platform/deployment.html)
- Architecture: [docs/architecture.md](docs/architecture.md)

---

## AI Assistant Tips

When working in this codebase:

1. **Understand the domain**: Read service-specific docs in `docs/services/` first
2. **Follow existing patterns**: Look at similar services for implementation patterns
3. **Use the SDK**: The `adsp-service-sdk` handles common platform integration
4. **Test thoroughly**: Both unit and integration tests are expected
5. **Consider multi-tenancy**: Always scope operations to tenant context
6. **Event-driven**: Signal domain events for state changes
7. **Document changes**: Keep docs in sync with code changes

For questions about specific services, check:
- Service README (if exists)
- Service documentation in `docs/services/`
- Existing implementation patterns in similar services
