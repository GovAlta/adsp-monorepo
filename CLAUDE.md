# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Nx is installed locally — always use `npx nx`, never a global `nx`.

```bash
# Build / serve
npx nx build <project>
npx nx serve <project>                        # hot reload
npx nx affected -t build                      # only changed projects

# Test
npx nx test <project>
npx nx test <project> --watch                 # local dev
npx nx test <project> --coverage
npx nx test <project> --configuration=ci      # CI mode (enables coverage)
npx nx affected -t test

# Lint / format
npx nx lint <project>
npx nx affected -t lint
npx nx format:write

# Explore
npx nx show projects                          # list all projects
npx nx show projects --pattern "*-service"    # filter
npx nx show project <name>                    # targets + config
npx nx dep-graph

# E2E
npx nx e2e <project>-e2e
```

Install: `npm ci` (set `PUPPETEER_SKIP_DOWNLOAD=true` to skip Chromium download).

## Architecture

ADSP is a multi-tenant platform of microservices for Alberta government product teams. Full AI-assistant reference: [`AGENTS.md`](AGENTS.md). Architecture standards: [`architecture/`](architecture/).

### Five foundational services

Every other service depends on these:

| Service | Role |
|---|---|
| `tenant-management-api` (`tenant-service`) | Tenant registry; maps tenants to Keycloak realms. All services resolve tenant context from this. |
| `directory-service` | URN → URL service discovery. Makes the platform environment-portable. |
| `configuration-service` | Tenant-scoped config storage; services register their schemas on startup. |
| `event-service` | Domain event routing via RabbitMQ + audit log. |
| `push-service` | WebSocket gateway; pushes domain events to browser clients. |

### Two-tier backend — where to build

```
New feature endpoint needed
  │
  ├─ Affects ONE service's own resources → build in that SERVICE (/v1/[resource])
  └─ Orchestrates MULTIPLE services     → build in a GATEWAY (/api/tenant/v1/...)
```

The primary gateway is `tenant-management-gateway`. See [`architecture/service-design-patterns.md`](architecture/service-design-patterns.md) for the full decision tree.

### URN convention

```
urn:ads:<namespace>:<service>:<api>:<resource>
# e.g. urn:ads:platform:tenant-service:v2:/tenants
```

`namespace` is `platform` for platform services, or the tenant name (kebab-case) for tenant services.

### Node.js service init pattern

All Node services initialize the same way via the SDK:

```typescript
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';

const { directory, tenantStrategy, configurationHandler, eventService } =
  await initializePlatform(
    { serviceId: AdspId.parse('urn:ads:platform:my-service'), accessServiceUrl, clientSecret, directoryUrl, configurationSchema, events, roles },
    { logger }
  );
```

`adsp-service-sdk` (Node.js), `core-common` (shared utils like `createLogger`, `createErrorHandler`), and `app-common` (React shared components) are the primary internal libraries.

### Multi-tenancy

JWT bearer tokens carry tenant context via the issuer (= tenant Keycloak realm). Records are tenant-scoped at the data level. Platform service accounts may specify tenant context explicitly.

### Required environment variables (per service)

`KEYCLOAK_ROOT_URL`, `DIRECTORY_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `MONGO_URI` or `POSTGRES_*`, `RABBITMQ_*`.

## Testing conventions

- Test files are **colocated** with source: `router.spec.ts` lives next to `router.ts`.
- Use `.spec.ts` — not `.test.ts` — for new files.
- `tests/` at the repo root is **integration and load tests only** — never unit tests.
- Each project has `jest.config.ts` extending the root `jest.preset.js`; extend the preset, don't duplicate it.

## Code conventions

- **Commits**: Conventional Commits — `type(scope): description`. Scope = project name for library changes. `BREAKING CHANGE:` footer triggers a major version bump.
- **TypeScript**: strict mode; interfaces over types for public APIs; barrel exports via `index.ts`.
- **Functions**: max 50 lines (`.cleancode.yml`). Complex conditions extracted into named functions.
- **Files**: kebab-case names and folders, one clear purpose per file.

## Multi-language workspace

The repo includes Node.js, .NET 10, Java 17 (Spring Boot), and Python 3.11 projects via Nx plugins (`@nx-dotnet/core`, `@nxlv/python`, `@nxrocks/nx-spring-boot`). SDKs for each language live in `libs/adsp-service-*-sdk/`. Custom workspace generators: `npx nx list workspace-plugin`.
