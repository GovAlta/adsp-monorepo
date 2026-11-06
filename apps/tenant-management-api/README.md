# Tenant Management API

Implements the ADSP tenant service (`urn:ads:platform:tenant-service`). See the [Tenant service documentation](https://govalta.github.io/adsp-monorepo/services/tenant-service.html) for what it does, its roles and its audit actions.

## Run locally

```bash
cp apps/tenant-management-api/.env.sample apps/tenant-management-api/.env
npx nx serve tenant-management-api
```

The service listens on `PORT` (default `3333`). The health endpoint is at `/health`.

## Test and lint

```bash
npx nx test tenant-management-api
npx nx lint tenant-management-api
```

## Environment variables

Variables are loaded with [dotenv](https://www.npmjs.com/package/dotenv) and validated in `src/environments/environment.ts`, which holds the full list and the defaults. `.env.sample` covers the variables you usually set for local development. Do not commit `.env`.

| Variable                                                                             | Purpose                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `MONGO_URI`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASSWORD`                              | Tenant database connection                     |
| `KEYCLOAK_ROOT_URL`                                                                  | Keycloak server                                |
| `CLIENT_ID`, `CLIENT_SECRET`                                                         | Service account of the tenant service          |
| `KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID`, `KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET` | Client used to create and manage tenant realms |
| `DIRECTORY_URL`                                                                      | Directory service                              |

Ask the team for the dev Keycloak client secrets.

## API documentation

The OpenAPI spec is built from `src/**/*.swagger.yml` (see `swagger.config.js`) and served at `/swagger/docs/v1`. Deprecated `/api/tenant/v1` operations are intentionally left out of the spec (CS-5446). `src/tenant/router/tenant.docs.spec.ts` checks that the routers' responses match the documented operations.
