# SharePoint Service (prototype)

Pushes data, such as form submissions, to SharePoint lists owned by tenant teams. ADSP never reads list data back.

- **Connections** (Entra tenant ID, client ID, site ID) and **destinations** (connection, list ID, field mappings, row identity fields, enabled) are tenant configuration in Configuration Service under `platform:test-sharepoint-service`. They never contain a secret.
- **Client secrets** are write-only. They are encrypted with AES-256-GCM, bound to the ADSP tenant and connection, and stored in this service's MongoDB.
- A push maps the data to list columns. If the destination has row identity fields (`idempotencyFields`), their values (joined with `|`) form a key that the service writes to the `AdspItemKey` column, and a later push with the same key overwrites that row. Without them, every push adds a row. Form Service destinations use `_adsp.key`, which Form Service sends with every submission.

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
2. Start MongoDB, for example with the binary the jest setup already cached:
   ```powershell
   New-Item -ItemType Directory -Force "$env:TEMP\sharepoint-mongo" | Out-Null
   & ".\node_modules\.cache\mongodb-memory-server\mongod-x64-win32-7.0.24.exe" --dbpath "$env:TEMP\sharepoint-mongo" --port 27017
   ```
3. Start the SharePoint mock server with `npx nx run sharepoint-service:serve-mock-server`. It stands in for Microsoft Entra sign-in and the Graph lists API for local development only; unit tests mock axios instead. The viewer at `http://localhost:3399/_mock` shows the seeded app registrations, sites, list IDs and rows.
4. Start the service with `npx nx serve sharepoint-service`, then check `http://localhost:3350/health`.
5. In `apps/tenant-management-webapp/.local.env`, set `NX_PUBLIC_SHAREPOINT_SERVICE_URL=http://localhost:3350` and `NX_PUBLIC_FEATURE_FLAGS={"SharePoint":true}`. Then run `npx nx serve tenant-management-webapp`, sign in through `http://localhost:4200/b6aff762-20f8-4c5d-88d3-c38ae16d1937/login`, and open `http://localhost:4200/admin/services/sharepoint`.

Inject failures into the mock server with:

```powershell
Invoke-RestMethod -Method Post http://localhost:3399/_mock/faults -ContentType application/json -Body '{"kind":"throttle","count":3}'
Invoke-RestMethod -Method Post http://localhost:3399/_mock/reset
```

`kind` is `throttle` (429 with `Retry-After`) or `unavailable` (503).

## SharePoint prerequisites (site owner)

- An Entra app registration with `Sites.Selected` and a `write` grant on the site.
- If the destination uses row identity (the default for new destinations), the list has a single-line text column `AdspItemKey` that is **indexed**. ADSP writes the row key into it to find and overwrite rows. Without row identity, no extra column is needed.

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
