# SharePoint Service (prototype)

Pushes data, such as form submissions, to SharePoint lists owned by tenant teams. ADSP never reads list data back.

- **Connections** (Entra tenant ID, client ID, site ID) and **destinations** (connection, list ID, field mappings, whether to update existing rows, enabled) are tenant configuration in Configuration Service under `platform:sharepoint-service`. They never contain a secret.
- **Client secrets** are write-only. They are encrypted with AES-256-GCM, bound to the ADSP tenant and connection, and stored in this service's MongoDB.
- A push maps the data to list columns, then writes it as a new row or updates an existing one:
  - **Any caller** can send `"_adsp": { "key": "<unique key>" }` with the data. When the destination has updating turned on (Tenant Management's "Update existing rows", saved as `idempotencyFields: ["_adsp.key"]`, the default), a push with the same key updates the row that has it in the `AdspItemKey` column. The caller chooses the key, for example a submission ID or an application number.
  - With updating turned off, every push adds a row.
  - The configuration also accepts other data paths in `idempotencyFields` (their values joined with `|`) for callers that can't send `_adsp.key`. These can only be set through Configuration Service, not Tenant Management.

## API (`/sharepoint/v1`)

| Endpoint | Role | Result |
|---|---|---|
| `PUT /connections/{id}/credentials` `{ clientSecret }` | `sharepoint-admin` | Stores the secret encrypted and clears the cached token. Returns `{ isSet: true, updatedAt }`. Returns 404 if the connection isn't in this tenant's configuration |
| `GET /connections/{id}/credentials` | `sharepoint-admin` | `{ isSet, updatedAt }`. Never the secret |
| `DELETE /connections/{id}/credentials` | `sharepoint-admin` | Deletes the secret. Returns 204 |
| `POST /destinations/{id}/test` with the data as the body | `sharepoint-admin` | Pushes the data through the same logic as a real push, even if the destination is disabled. Returns `{ ok: true, outcome }` or `{ ok: false, errorCode, column? }`; `row-identity-missing` means the data has no value for a row identity field, and `credential-unreadable` means the saved secret can't be decrypted (for example after `CREDENTIALS_KEY` changed without its previous key being kept for the rotation) and must be entered again |
| `POST /destinations/{id}/data` with the data as the body | `sharepoint-writer` (core service accounts with `?tenantId=`). Tenant admins check destinations with Test instead | Returns 200 `{ dataId, outcome, date }`, where `dataId` is the SharePoint item ID and `outcome` is `created` or `updated`. Nothing is stored. Failures: 400 data missing a row identity field, 404 unknown destination or connection, 409 `destination-disabled`, `credential-not-set` or `credential-unreadable`, 502 `{ errorCode, retryable, column? }` |
| `POST /destinations/{id}/files` `{ submissionId, files: [{ field, fileId }], data? }` | `sharepoint-writer` (core service accounts with `?tenantId=`). Tenant admins check destinations with Test instead | Reads each file from File Service by file ID or `urn:ads:platform:file-service` URN (any other URN is rejected), uploads it to the site's default Documents library under `{submissionId}/{filename}`, then writes `data` as a list row with each file's link set at its `field`. Up to 20 files per request, uploaded 3 at a time. The link is a Hyperlink value unless the destination's field mapping for that field sets `linkFormat: "text"`, which writes the plain URL. The row is written only when every file uploaded, so a retry of the whole request is safe: files are overwritten by path, and the row is updated when its key matches. Without `data`, only the files are uploaded. Returns `{ files: [{ field, fileId, status, id, name, url, size } or { field, fileId, status: "failed", errorCode, retryable }], row?: { written, dataId, outcome } or { written: false, errorCode, retryable } }`; `row` is missing when `data` was not sent or a file failed. 200 when everything succeeds, 502 when any file fails or the row can't be written, 409 `destination-disabled`, `credential-not-set` or `credential-unreadable`, 404 unknown destination or connection, 400 invalid request, more than 20 files, or data missing a row identity field |
Error codes are `entra:AADSTS<code>`, `graph:<code>`, `file:<code>`, `network` or `unknown`. The `file:` codes are `invalid-reference`, `not-found`, `access-denied`, `not-ready` (File Service has not finished scanning the file, so retry), `unavailable` and `size-mismatch`. Payload values never appear in responses or logs.

## Domain events

The service registers two events (namespace `sharepoint-service`) and sends one per file in a `/files` request. They carry no file names, links or form data. `correlationId` is the submission ID, and the context holds `destinationId` and `submissionId`.

| Event | When | Payload |
|---|---|---|
| `file-uploaded` | A file was uploaded to the Documents library | `destinationId`, `submissionId`, `field`, `fileId`, `sharepointFileId`, `size` |
| `file-upload-failed` | A file could not be read or uploaded | `destinationId`, `submissionId`, `field`, `fileId`, `errorCode`, `retryable` |

A request rejected before any upload (invalid, disabled destination, no secret) sends no events. Failing to send an event never fails the upload.

## Environment

| Variable | Default |
|---|---|
| `KEYCLOAK_ROOT_URL` | `https://access.adsp-dev.gov.ab.ca` |
| `DIRECTORY_URL` | `http://localhost:3331` |
| `CLIENT_ID` | `urn:ads:platform:sharepoint-service` |
| `CLIENT_SECRET` | required |
| `CREDENTIALS_KEY` | required; base64 of 32 random bytes |
| `CREDENTIALS_KEY_VERSION` | `1` |
| `CREDENTIALS_KEY_PREVIOUS`, `CREDENTIALS_KEY_PREVIOUS_VERSION` | empty, `0`. Set only during a key rotation: the previous key is used to read secrets not yet re-encrypted, never to encrypt |
| `MONGO_URI`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_TLS` | `mongodb://localhost:27017`, `sharepointDb`, empty, empty, `false` |
| `ENTRA_AUTHORITY_URL` | `https://login.microsoftonline.com` |
| `GRAPH_URL` | `https://graph.microsoft.com/v1.0` |
| `FILE_UPLOAD_CONCURRENCY` | `3`; files uploaded at the same time per request |
| `DEV_FILES_DIRECTORY` | empty; local development only. When set, `fileId` values such as `local:report.pdf` are read from this folder instead of File Service |
| `PORT` | `3350` |

Generate a key with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Local demo

The service reads `.env` from the folder it is started in, and `nx serve` starts it from the repo root. So build it, then run it with `node` from `apps/sharepoint-service`.

1. Create `apps/sharepoint-service/.env`. It is git-ignored.
   ```
   KEYCLOAK_ROOT_URL=https://access.adsp-dev.gov.ab.ca
   DIRECTORY_URL=https://directory-service.adsp-dev.gov.ab.ca
   CLIENT_ID=urn:ads:platform:sharepoint-service
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

## Rotating `CREDENTIALS_KEY`

Every saved secret records the key version it was encrypted with. During a rotation the service reads secrets with either the current or the previous key, so pushes keep working, and a one-off job (`dist/apps/sharepoint-service/reencrypt.js`, in the service image) re-encrypts the saved secrets with the new key. Tenants don't need to do anything.

If `CREDENTIALS_KEY_PREVIOUS` is already set, run the job (step 3) first, and continue only when it reports `0 failed`. Step 1 replaces the previous key, so a secret still on it would become unreadable.

1. **Set the new key**, moving the current key to the previous key, in one command (`$ns` is `adsp-dev`, `adsp-uat` or `adsp-prod`):
   ```powershell
   $decode = { param($value) [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($value)) }
   $secret = oc get secret sharepoint-service -n $ns -o json | ConvertFrom-Json
   $currentVersion = if ($secret.data.CREDENTIALS_KEY_VERSION) { [int](& $decode $secret.data.CREDENTIALS_KEY_VERSION) } else { 1 }
   $newKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   oc set data secret/sharepoint-service -n $ns `
     "CREDENTIALS_KEY_PREVIOUS=$(& $decode $secret.data.CREDENTIALS_KEY)" "CREDENTIALS_KEY_PREVIOUS_VERSION=$currentVersion" `
     "CREDENTIALS_KEY=$newKey" "CREDENTIALS_KEY_VERSION=$($currentVersion + 1)"
   Remove-Variable secret, newKey
   ```
2. **Restart the service** with a rolling restart, so the new pod is ready before the old one stops:
   ```powershell
   oc rollout resume deployment/sharepoint-service -n $ns
   oc rollout restart deployment/sharepoint-service -n $ns
   oc rollout status deployment/sharepoint-service -n $ns
   oc rollout pause deployment/sharepoint-service -n $ns
   ```
3. **Run the re-encryption job**, built from the deployment's pod spec so it always has the service's image, settings and database. The labels are left out so the Service doesn't route traffic to the job, and the probes and ports because the job doesn't serve HTTP:
   ```powershell
   $deployment = oc get deployment sharepoint-service -n $ns -o json | ConvertFrom-Json
   $pod = $deployment.spec.template.spec
   $container = $pod.containers[0]
   'livenessProbe', 'readinessProbe', 'startupProbe', 'ports' | ForEach-Object { $container.PSObject.Properties.Remove($_) }
   $container.name = 'reencrypt'
   $container | Add-Member -Force -NotePropertyName command -NotePropertyValue @('node', 'dist/apps/sharepoint-service/reencrypt.js')
   $pod.containers = @($container)
   $pod.restartPolicy = 'Never'
   $job = @{ apiVersion = 'batch/v1'; kind = 'Job'; metadata = @{ name = 'sharepoint-service-reencrypt' }; spec = @{ backoffLimit = 0; ttlSecondsAfterFinished = 86400; template = @{ spec = $pod } } } | ConvertTo-Json -Depth 30
   oc delete job sharepoint-service-reencrypt -n $ns --ignore-not-found
   $job | oc create -n $ns -f -
   oc wait --for=jsonpath='{.status.conditions[0].type}' job/sharepoint-service-reencrypt -n $ns --timeout=600s
   oc logs job/sharepoint-service-reencrypt -n $ns
   ```
   The log reports how many secrets were on an older version, converted, saved again during the run (already on the new key) and failed. The job fails if any secret failed; those were already unreadable before the rotation, and their tenants must enter them again. It is safe to run again.
4. **Keep the previous key** until the next rotation replaces it. It isn't needed once the job reports no failures.

To roll back, swap the current and previous keys and versions with `oc set data`, restart (step 2) and run the job again (step 3).

## SharePoint prerequisites (site owner)

- An Entra app registration with `Sites.Selected` and a `write` grant on the site.
- If the destination updates existing rows (the default for new destinations), the list has a single-line text column `AdspItemKey` that is **indexed**. ADSP writes the row key into it to find and update rows. Without updating, no extra column is needed.

## One-time Keycloak setup (dev)

- **Core realm:**
  - Create a confidential client `urn:ads:platform:sharepoint-service` with a service account.
  - Give the service account the roles `urn:ads:platform:tenant-service:platform-service` and `urn:ads:platform:configuration-service:configured-service`.
  - Add an **Audience** mapper to the client's dedicated scope with the included client audience `urn:ads:platform:push-service`, added to the access token. Without it, the service logs `User not authorized to connect` and doesn't see configuration changes until its cache expires.
  - Create the client role `sharepoint-writer` and grant it to `service-account-urn:ads:platform:form-service`.
- **Tenant realm:** tenants created after the service has registered get the client automatically, with `sharepoint-admin` included in `tenant-admin`. For an existing tenant:
  - Create a client `urn:ads:platform:sharepoint-service` with every authentication flow off, holding the role `sharepoint-admin`.
  - Add `sharepoint-admin` to the associated roles of `urn:ads:platform:tenant-service` `tenant-admin`, so every tenant admin has it.

## Development

```powershell
npx jest -c apps/sharepoint-service/jest.config.ts
npx nx lint sharepoint-service
npx nx build sharepoint-service
npx nx run sharepoint-service:build-mock-server
```
