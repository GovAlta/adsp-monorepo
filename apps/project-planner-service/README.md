# Project planner service

## Running locally

The local runner (`src/local.ts`) serves the planner API with a fake dev user and in-memory storage. It does not need Keycloak or other platform services.

### 1. Add your MaaS key

Create `apps/project-planner-service/.env`. It is git-ignored; do not use another file name, since the runner only reads `.env`.

```
MAAS_API_KEY=<your key>
```

The key is optional. Without it, the planner runs but AI analysis is not available.

### 2. Start the planner

From the repo root:

```powershell
$env:NODE_OPTIONS = '--use-system-ca'
$env:TS_NODE_PROJECT = 'apps/project-planner-service/tsconfig.app.json'
$env:TS_NODE_TRANSPILE_ONLY = 'true'
node -r ts-node/register -r tsconfig-paths/register apps/project-planner-service/src/local.ts
```

### 3. Open the UI

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
- Data is held in memory and is lost when the planner stops.
