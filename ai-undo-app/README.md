# AI Undo

Standalone Vite + React chat app. Independent from the Nx monorepo apps/libs.

It uses the same Keycloak public client as tenant-admin (`urn:ads:platform:tenant-admin-app`) and connects to agent-service over socket.io.

## Chat history

On connect (and via **Reload**), the app calls:

- `GET /agent/v1/agents/:agentId/threads` — list your threads (sidebar)
- `GET /agent/v1/agents/:agentId/threads/:threadId/messages` — load the selected thread
- `POST /agent/v1/agents/:agentId/threads/:threadId/rollback` — keep through a message, delete everything after

The active thread id is kept in `localStorage`. **New chat** starts a new thread id. Use **Rollback here** on a message to truncate Mastra memory.

## Prerequisites

- Local agent-service running on `http://localhost:3380` (or set `VITE_AGENT_SERVICE_URL`)
- Keycloak client allows this app origin:
  - Redirect URI: `http://localhost:4200/*` (or your Vite origin)
  - Web origin: `http://localhost:4200`
- Signed-in user has the `agent-user` role on `urn:ads:platform:agent-service`

## Setup

```bash
cd ai-undo-app
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:4200, enter tenant name (e.g. `autotest`) or realm UUID, sign in. Keycloak returns you to `/chat`.

## Environment

| Variable | Default |
|----------|---------|
| `VITE_KEYCLOAK_URL` | `https://access.adsp-dev.gov.ab.ca/auth` |
| `VITE_KEYCLOAK_CLIENT_ID` | `urn:ads:platform:tenant-admin-app` |
| `VITE_DEFAULT_REALM` | `autotest` |
| `VITE_TENANT_API_URL` | `https://tenant-service.adsp-dev.gov.ab.ca` |
| `VITE_AGENT_SERVICE_URL` | `http://localhost:3380` |
| `VITE_AGENT_ID` | `mock-agent` |
