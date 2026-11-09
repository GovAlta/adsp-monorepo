# SharePoint Service (prototype)

Pushes data, such as form submissions, to SharePoint lists owned by tenant teams. ADSP never reads list data back.

- **Connections** (Entra tenant ID, client ID, site ID) and **destinations** (connection, list ID, field mappings, whether to update existing rows, enabled) are tenant configuration in Configuration Service under `platform:test-sharepoint-service`. They never contain a secret.
- **Client secrets** are write-only. They are encrypted with AES-256-GCM, bound to the ADSP tenant and connection, and stored in this service's MongoDB.
- A push maps the data to list columns, then writes it as a new row or updates an existing one:
  - **Any caller** can send `"_adsp": { "key": "<unique key>" }` with the data. When the destination has updating turned on (Tenant Management's "Update existing rows", saved as `idempotencyFields: ["_adsp.key"]`, the default), a push with the same key updates the row that has it in the `AdspItemKey` column. The caller chooses the key, for example a submission ID or an application number.
  - With updating turned off, every push adds a row.
  - The configuration also accepts other data paths in `idempotencyFields` (their values joined with `|`) for callers that can't send `_adsp.key`. These can only be set through Configuration Service, not Tenant Management.

## API (`/sharepoint/v1`)

| Endpoint | Role | Result |
|---|---|---|
| `PUT /connections/{id}/credentials` `{ clientSecret }` | `test-sharepoint-admin` | Stores the secret encrypted and clears the cached token. Returns `{ isSet: true, updatedAt }`. Returns 404 if the connection isn't in this tenant's configuration |
| `GET /connections/{id}/credentials` | `test-sharepoint-admin` | `{ isSet, updatedAt }`. Never the secret |
| `DELETE /connections/{id}/credentials` | `test-sharepoint-admin` | Deletes the secret. Returns 204 |
| `POST /destinations/{id}/test` with the data as the body | `test-sharepoint-admin` | Pushes the data through the same logic as a real push, even if the destination is disabled. Returns `{ ok: true }` or `{ ok: false, errorCode, column? }`; `row-identity-missing` means the data has no value for a row identity field |
| `POST /destinations/{id}/data` with the data as the body | `test-sharepoint-writer` (core service accounts with `?tenantId=`). Tenant admins check destinations with Test instead | Returns 200 `{ dataId, date }`, where `dataId` is the SharePoint item ID. Nothing is stored. Failures: 400 data missing a row identity field, 404 unknown destination or connection, 409 `destination-disabled` or `credential-not-set`, 502 `{ errorCode, retryable, column? }` |
Error codes are `entra:AADSTS<code>`, `graph:<code>`, `network` or `unknown`. Payload values never appear in responses or logs.

## Environment

| Variable | Default |
|---|---|
| `KEYCLOAK_ROOT_URL` | `https://access.adsp-dev.gov.ab.ca` |
| `DIRECTORY_URL` | `http://localhost:3331` |
| `CLIENT_ID` | `urn:ads:platform:test-sharepoint-service` |
| `CLIENT_SECRET` | required |
| `CREDENTIALS_KEY` | required; base64 of 32 random bytes |
| `CREDENTIALS_KEY_VERSION` | `1` |
| `MONGO_URI`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_TLS` | `mongodb://localhost:27017`, `sharepointDb`, empty, empty, `false` |
| `ENTRA_AUTHORITY_URL` | `https://login.microsoftonline.com` |
| `GRAPH_URL` | `https://graph.microsoft.com/v1.0` |
| `PORT` | `3350` |

Generate a key with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Local demo

The service reads `.env` from the folder it is started in, and `nx serve` starts it from the repo root. So build it, then run it with `node` from `apps/sharepoint-service`.

1. Create `apps/sharepoint-service/.env`. It is git-ignored.
   ```
   KEYCLOAK_ROOT_URL=https://access.adsp-dev.gov.ab.ca
   DIRECTORY_URL=https://directory-service.adsp-dev.gov.ab.ca
   CLIENT_ID=urn:ads:platform:test-sharepoint-service
   CLIENT_SECRET=<secret of the client in the dev core realm>
   CREDENTIALS_KEY=<generated key>
   ENTRA_AUTHORITY_URL=http://localhost:3399
   GRAPH_URL=http://localhost:3399/v1.0
   ```
   Generate `CREDENTIALS_KEY` with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
2. Start MongoDB on port 27017, either with Docker:
   ```powershell
   docker run -d --name sharepoint-mongo -p 27017:27017 mongo:7
   ```
   or with the binary the jest setup caches after the tests have run once:
   ```powershell
   New-Item -ItemType Directory -Force "$env:TEMP\sharepoint-mongo" | Out-Null
   & ".\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-7.0.24.exe" --dbpath "$env:TEMP\sharepoint-mongo" --port 27017
   ```
3. Build the service and the SharePoint mock server: `npx nx run-many -t build build-mock-server -p sharepoint-service`. Rebuild and restart after code changes.
4. From the repo root, start the SharePoint mock server: `node dist/apps/sharepoint-mock-server/main.js`. It stands in for Microsoft Entra sign-in and the Graph lists API for local development only; unit tests mock axios instead. The viewer at `http://localhost:3399/_mock` shows the seeded app registrations, sites, list IDs and rows.
5. From `apps/sharepoint-service`, start the service: `node ../../dist/apps/sharepoint-service/main.js`. Check `http://localhost:3350/health` shows every value as `true`.
6. In `apps/tenant-management-webapp/.local.env`, set `NX_PUBLIC_SHAREPOINT_SERVICE_URL=http://localhost:3350` and `NX_PUBLIC_FEATURE_FLAGS={"SharePoint":true}`. Then run `npx nx serve tenant-management-webapp`, sign in through `http://localhost:4200/<tenant realm ID>/login`, and open `http://localhost:4200/admin/services/sharepoint`.

Inject failures into the mock server with:

```powershell
Invoke-RestMethod -Method Post http://localhost:3399/_mock/faults -ContentType application/json -Body '{"kind":"throttle","count":3}'
Invoke-RestMethod -Method Post http://localhost:3399/_mock/reset
```

`kind` is `throttle` (429 with `Retry-After`) or `unavailable` (503).

## SharePoint prerequisites (site owner)

- An Entra app registration with `Sites.Selected` and a `write` grant on the site.
- If the destination updates existing rows (the default for new destinations), the list has a single-line text column `AdspItemKey` that is **indexed**. ADSP writes the row key into it to find and update rows. Without updating, no extra column is needed.

## One-time Keycloak setup (dev)

- **Core realm:**
  - Create a confidential client `urn:ads:platform:test-sharepoint-service` with a service account.
  - Give the service account the roles `urn:ads:platform:tenant-service:platform-service` and `urn:ads:platform:configuration-service:configured-service`.
  - Create the client role `test-sharepoint-writer` and grant it to `service-account-urn:ads:platform:form-service`.
- **Tenant realm:**
  - Create a client `urn:ads:platform:test-sharepoint-service` that holds the role `test-sharepoint-admin`.
  - Assign that role to the tenant admins who manage connections.

## Development

```powershell
npx jest -c apps/sharepoint-service/jest.config.ts
npx nx lint sharepoint-service
npx nx build sharepoint-service
npx nx run sharepoint-service:build-mock-server
```
