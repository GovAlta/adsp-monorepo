# Project planner service

## Running locally

The local runner (`src/local.ts`) serves the planner API with a fake dev user and tenant on a local Postgres. It does not need Keycloak or other platform services. Point it at a local database only; never at a shared environment, since it writes rows for the fake `local` tenant.

### 1. Start a local Postgres

Any Postgres 14+ works. For example, with Docker or Podman:

```powershell
podman run -d --name planner-pg -e POSTGRES_PASSWORD=<local password> -p 5432:5432 postgres:16
```

The runner creates its tables on startup, so the database can be empty.

### 2. Add your settings

Create `apps/project-planner-service/.env`. It is git-ignored; do not use another file name, since the runner only reads `.env`.

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<local password>
MAAS_API_KEY=<your key>
```

Each `DB_*` setting defaults to the value shown, except `DB_PASSWORD`, which defaults to `guest`. Leave `DB_TLS` unset for a local database. The MaaS key is optional; without it, the planner runs but AI analysis is not available.

### 3. Start the planner

From the repo root:

```powershell
$env:NODE_OPTIONS = '--use-system-ca'
$env:TS_NODE_PROJECT = 'apps/project-planner-service/tsconfig.app.json'
$env:TS_NODE_TRANSPILE_ONLY = 'true'
node -r ts-node/register -r tsconfig-paths/register apps/project-planner-service/src/local.ts
```

Look for `Database migrations upped to latest.` in the log.

### 4. Open the UI

The planner UI lives in the tenant management webapp. Add this to `apps/tenant-management-webapp/.local.env`:

```
NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL=http://localhost:3381
```

Then run `npx nx serve tenant-management-webapp` and go to http://localhost:4200. If the key was picked up, AI analysis is available as an option.

### Troubleshooting

- Use `ts-node` as shown, not `tsx`. `tsx` fails on this repo's decorators.
- `--use-system-ca` lets Node trust the GoA certificates for the MaaS endpoint. Don't work around certificate errors with `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- The MaaS endpoint is internal, so you need to be on the GoA network or VPN.
- `.env` is only read at startup, so restart the planner after changing it.
- If the runner exits with `Failed to start local planner`, check that Postgres is running and the `DB_*` settings match it.
