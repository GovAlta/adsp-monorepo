# ADSP Project Planner — Local Dev Test Harness

> **⚠️ NOT FOR PRODUCTION.** This module stubs Keycloak, MongoDB, and the ADSP platform SDK.
> It exists solely to let you run and test the planner-ui locally without any external services.

## What it does

- Runs an Express server on **port 3001**
- Stubs all 29+ API endpoints from the real `planner-service` OpenAPI spec
- Provides an in-memory data store seeded with realistic sample data
- Issues dev JWTs signed with a local secret (no Keycloak needed)
- Serves a dev dashboard UI at `http://localhost:3001`

## Quick start

```bash
# 1. Install deps (one-time)
cd apps/local-dev
npm install

# 2. Start the stub server
node src/server.js
# → http://localhost:3001

# 3. (Optional) Start the real planner-ui against this stub
# In a second terminal:
cd apps/planner-ui
npm run dev
# → http://localhost:5173  (uses .env.local to point at localhost:3001)
```

## Dev dashboard

Open **http://localhost:3001** in your browser:

- **Login as Persona** — click a persona button to get a dev JWT (stored in localStorage)
- **API Explorer** — click any endpoint to fire it and see the live JSON response
- **Planner UI links** — direct links to all 12 planner-ui pages (requires `npm run dev` in `apps/planner-ui`)

## Dev login endpoint

```
GET /dev-login?persona=admin   → JWT with planner-admin + tenant-admin roles
GET /dev-login?persona=user    → JWT with planner-user role
GET /dev-login?persona=viewer  → JWT with no roles
```

Each returns `{ token, persona, claims }`. The token is valid for 24 hours.

## Auth behaviour

The stub server accepts **any** Bearer token or **no token at all**. If no token is sent,
it defaults to a `planner-admin` persona. This lets you test the UI without clicking "Login".

## Seeded data

| Resource | IDs |
|---|---|
| Sessions | `sess-001` (active), `sess-002` (paused), `sess-003` (completed) |
| Business Models | `bm-001` (4 concepts), `bm-002` (2 concepts), `bm-003` (empty) |
| Messages | 3 messages on `sess-001`, 1 on `sess-002` |
| Hypotheses | 2 on `sess-001` (`hyp-001` proposed, `hyp-002` draft) |
| Patterns | `pat-001`, `pat-002`, `pat-003` |
| Audit events | 3 entries |
| Users | `admin@gov.ab.ca`, `user@gov.ab.ca`, `viewer@gov.ab.ca` |

All data resets when you restart the server.

## planner-ui .env.local

`apps/planner-ui/.env.local` is created automatically by this module.
It overrides `.env` to point the UI at `http://localhost:3001/api/v1`.
This file is git-ignored by default in Vite projects.

## Files

```
apps/local-dev/
  package.json       — dependencies: express, cors, jsonwebtoken, uuid
  src/
    server.js        — Express stub server (port 3001, all endpoints)
    store.js         — In-memory data store with seed data
    ui/
      index.html     — Dev dashboard (self-contained, no build step)
```
