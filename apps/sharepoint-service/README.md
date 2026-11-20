# SharePoint Service (prototype)

Pushes data, such as form submissions, to SharePoint lists owned by tenant teams. ADSP never reads list data back.

- **Connections** (Entra tenant ID, client ID, site ID) and **destinations** (connection, list ID, field mappings, whether to update existing rows, enabled) are tenant configuration in Configuration Service under `platform:sharepoint-service`. They never contain a secret.
- **Client secrets** are write-only. They are encrypted with AES-256-GCM, bound to the ADSP tenant and connection, and stored in this service's MongoDB.
- A push maps the data to list columns, then writes it as a new row or updates an existing one:
  - **Any caller** can send `"_adsp": { "key": "<unique key>" }` with the data. When the destination has updating turned on (Tenant Management's "Update existing rows", saved as `idempotencyFields: ["_adsp.key"]`, the default), a push with the same key updates the row that has it in the `AdspItemKey` column. The caller chooses the key, for example a submission ID or an application number.
  - With updating turned off, every push adds a row.
  - The configuration also accepts other data paths in `idempotencyFields` (their values joined with `|`) for callers that can't send `_adsp.key`. These can only be set through Configuration Service, not Tenant Management.
- Data paths in mappings and file fields use `.` for fields and `[n]` or `.n` for array items, for example `dependents[1].birthCertificate` or `dependents.1.birthCertificate` (Form Service sends the first form). A missing parent or array item is created, as before; a file path that runs through a value that is neither an object nor an array, such as text, is rejected before anything is uploaded.
- A mapped value that is an array of text or numbers, such as a multi-select answer, is sent as a collection so it fills a Choice column that allows multiple selections. An empty array clears the column.
- **Detail lists** hold repeating sections, such as household members. Each has a list ID, a `dataPath` to the array in the data, a `parentRefField` and mappings relative to each item:
  - After the main row is written, each array item becomes one row in the detail list, with `parentRefField` set to the main row's item ID. Rows are written 3 at a time, and an array of more than 100 items is rejected before anything is written.
  - On a re-push that updates the main row, the new detail rows are written first, then the old ones (found by `parentRefField`) are deleted. If any new row fails, the rows already written by that push are removed and the old rows stay, so the list never mixes old and new items and a retry of the whole push ends with exactly the current items.
  - `parentRefField` must be an indexed single line of text column. A destination with detail lists needs row identity, and a detail list that has only a `listName` (not set up yet) makes pushes fail with `destination-not-set-up`.
  - A file in a repeating item, such as `dependents[1].birthCertificate`, goes on that item's row, in the format of the detail list's mapping for it.
- With `folderLinkField` set, a `/files` push puts a Hyperlink to the submission's folder of files in that column of the main row.
- Uploaded files go to the site's Documents library, or to the document library whose list ID is in `documentFilesLibraryId`. The library's drive is looked up once per destination and cached. A library that was deleted, or an ID that belongs to an ordinary list, fails the request before any file is uploaded with `document-library-not-found` or `not-a-document-library`; a library deleted after it was cached fails that upload and the next request looks it up again.
  - With only `documentFilesLibraryName` set, setup creates a document library with that name and Tenant Management saves its ID. Until then, `/files` and Test fail with `destination-not-set-up` rather than using Documents.
- A mapping can set `columnType` (`text`, `multilineText`, `number`, `dateTime`, `boolean`, `multiChoice` or `hyperlink`), `displayName` and `choices`. They are used to create missing columns and to check existing ones. For a file, `columnType` also decides the link format (`hyperlink` writes a link, a text type the plain URL) and takes over from `linkFormat`.

## API (`/sharepoint/v1`)

| Endpoint | Role | Result |
|---|---|---|
| `PUT /connections/{id}/credentials` `{ clientSecret }` | `sharepoint-admin` | Stores the secret encrypted and clears the cached token. Returns `{ isSet: true, updatedAt }`. Returns 404 if the connection isn't in this tenant's configuration |
| `GET /connections/{id}/credentials` | `sharepoint-admin` | `{ isSet, updatedAt }`. Never the secret |
| `DELETE /connections/{id}/credentials` | `sharepoint-admin` | Deletes the secret. Returns 204 |
| `POST /destinations/{id}/test` with the data as the body | `sharepoint-admin` | Pushes the data through the same logic as a real push, even if the destination is disabled. Returns `{ ok: true, outcome, detailRows? }` or `{ ok: false, errorCode, column?, detailFailures? }`; `row-identity-missing` means the data has no value for a row identity field, `destination-not-set-up` means a detail list or the named document library isn't created yet, `document-library-not-found` and `not-a-document-library` mean the destination's document library can't be used (Test checks it, but uploads no files), and `credential-unreadable` means the saved secret can't be decrypted (for example after `CREDENTIALS_KEY` changed without its previous key being kept for the rotation) and must be entered again |
| `POST /destinations/{id}/data` with the data as the body | `sharepoint-writer` (core service accounts with `?tenantId=`). Tenant admins check destinations with Test instead | Returns 200 `{ dataId, outcome, date, detailRows? }`, where `dataId` is the SharePoint item ID, `outcome` is `created` or `updated`, and `detailRows` is `[{ listId, rowIds }]` for destinations with detail lists. Nothing is stored. Failures: 400 data missing a row identity field or an invalid detail array, 404 unknown destination or connection, 409 `destination-disabled`, `destination-not-set-up`, `credential-not-set` or `credential-unreadable`, 502 `{ errorCode, retryable, column? }`. When the main row was written but detail rows failed, the 502 also has `dataId` and `detailFailures: [{ listId, indexes, oldRowsLeft?, newRowsLeft?, column? }]` (`indexes` are the array items not written; `oldRowsLeft` counts old rows not deleted and `newRowsLeft` rows from the failed push that could not be removed) |
| `POST /destinations/{id}/files` `{ submissionId, files: [{ field, fileId }], data? }` | `sharepoint-writer` (core service accounts with `?tenantId=`). Tenant admins check destinations with Test instead | Reads each file from File Service by file ID or `urn:ads:platform:file-service` URN (any other URN is rejected), uploads it to the destination's document library under `{submissionId}/{filename}`, then writes `data` as a list row with each file's link set at its `field`. Up to 20 files per request, uploaded 3 at a time. The link is a Hyperlink value unless the destination's field mapping for that field sets `linkFormat: "text"`, which writes the plain URL. The row is written only when every file uploaded, so a retry of the whole request is safe: files are overwritten by path, and the row is updated when its key matches. Without `data`, only the files are uploaded. Returns `{ files: [{ field, fileId, status, id, name, url, size } or { field, fileId, status: "failed", errorCode, retryable }], row?: { written, dataId, outcome, detailRows? } or { written: false, errorCode, retryable, dataId?, detailFailures? } }`; `row` is missing when `data` was not sent or a file failed, and a row whose detail rows failed is reported as not written, with the main row's `dataId`. 200 when everything succeeds, 502 when any file fails or the row can't be written, 502 `{ errorCode, retryable: false }` when the document library can't be used, 409 `destination-disabled`, `destination-not-set-up`, `credential-not-set` or `credential-unreadable`, 404 unknown destination or connection, 400 invalid request, more than 20 files, a file path that doesn't fit the data, or data missing a row identity field |
| `POST /destinations/{id}/verify` | `sharepoint-admin` | Reads the column definitions of the main list and each detail list, never their rows, and returns `{ ready, lists: [{ kind, listId?, listName?, dataPath?, status, columns: [{ name, displayName, purpose, expectedType?, status, actualType?, matchingName? }] }], documentLibrary? }`. `documentLibrary` is `{ libraryId?, libraryName?, status }` when the destination sets a library ID or name, with `status` `ok`, `notCreated` (a name but no ID yet), `notFound` or `notADocumentLibrary`, and `ready` is false unless it is `ok`. A list's `status` is `ok`, `notCreated` (a detail list with only a name) or `notFound`; a column's is `ok`, `missing`, `notIndexed` or `wrongType`, and `matchingName` is the internal name of a column whose display name matches. Same 409 and 502 failures as Test |
| `POST /destinations/{id}/setup` | `sharepoint-admin` | Creates the detail lists that have only a name (making their `Title` column optional) and the document library named in `documentFilesLibraryName` when it has no ID, adds the missing columns with each mapping's `columnType` (text when unset) and indexes `AdspItemKey` and each `parentRefField`. It only adds; existing columns are never changed or deleted. Returns `{ createdLists: [{ index, dataPath, listName, listId }], createdLibrary?: { libraryName, libraryId }, createdColumns, indexedColumns, failures, permissionDenied, report }`; the caller saves the new list and library IDs on the destination. A list or library that already has the library's name is never taken over: setup reports `library-name-taken` in `failures` and creates nothing for it. `permissionDenied` means the app's grant can't change lists or columns, and `report` then shows what the site owner has to add. 409 `list-name-taken` with `lists` when a list with the same name already exists: it is never reused by name, because two detail lists sharing a list would replace each other's rows. To use an existing list, enter its ID on the detail list |

Test, verify and setup read the tenant's configuration fresh rather than from the cache, so they see a destination saved a moment before.

Error codes are `entra:AADSTS<code>`, `graph:<code>`, `file:<code>`, `network` or `unknown`. The `file:` codes are `invalid-reference`, `not-found`, `access-denied`, `not-ready` (File Service has not finished scanning the file, so retry), `unavailable` and `size-mismatch`. Payload values never appear in responses or logs.

## Retries

Throttling and brief outages shouldn't fail a push, so the service retries Graph and Entra calls that fail with 429, 503, 504 or a network error. It never retries other 4xx errors (for example `invalidRequest`, `accessDenied` or a rejected or expired secret), since they need a configuration change.

- Up to 3 retries per call, with exponential backoff and jitter (about 1, 2 and 4 seconds). A `Retry-After` sent by Graph or Entra is used instead of the backoff.
- All retries in one request share a waiting budget of 20 seconds, and no retry starts once the request is 40 seconds old, so a request stays inside the 60 second route timeout. When the budget runs out, the last error is returned with `retryable: true`.
- This covers the token request, the key lookup, row create and row update, a simple file upload, creating an upload session, and each chunk of a session upload. Only the failed chunk is sent again, and the session is deleted only when the upload is given up. A file of up to 4 MB is read into memory before it is sent, so it can be sent again.
- A destination with a row key repeats the lookup before it writes again, so a create that actually succeeded becomes an update. A destination without one repeats a create only when Graph refused it (429 or 503), never after a timeout or lost response, because the row may already exist.
- Detail lists: finding the old detail rows and deleting them are repeated after any of these failures, since both are safe to repeat. A detail row has no key of its own, so its create is repeated only when Graph refused it.
- Verify and setup: reading columns and lists, indexing a column and setting its display name are repeated after any of these failures. Creating a list or a column is repeated only when Graph refused it, because a second create after a lost response would add a duplicate.
- The folder link lookup for `folderLinkField` and the document library lookup are repeated like any other read.
- Test uses the same logic. Each retry is logged with its number and the error code only.

Retries that outlast one request, for example a long outage, are the caller's to make using the `retryable` flag.

## Domain events

The service registers two events (namespace `sharepoint-service`) and sends one per file in a `/files` request. They carry no file names, links or form data. `correlationId` is the submission ID, and the context holds `destinationId` and `submissionId`.

| Event | When | Payload |
|---|---|---|
| `file-uploaded` | A file was uploaded to the document library | `destinationId`, `submissionId`, `field`, `fileId`, `sharepointFileId`, `size` |
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

`kind` is `throttle` (429 with `Retry-After: 2`) or `unavailable` (503). Each fault is used up by one Graph request, so `count` is the number of failed requests in a row. The mock server has no file endpoints, so file upload retries are covered by unit tests only.

## SharePoint prerequisites (site owner)

- An Entra app registration with `Sites.Selected` and a `write` grant on the site.
- If the destination updates existing rows (the default for new destinations), the list has a single-line text column `AdspItemKey` that is **indexed**. ADSP writes the row key into it to find and update rows. Without updating, no extra column is needed.
- Setting up a destination from Tenant Management (creating detail lists, a document library and columns) needs an `owner` or `fullcontrol` grant. With `write`, the setup reports what the site owner has to create instead.

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
