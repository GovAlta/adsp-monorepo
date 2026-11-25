---
layout: page
title: SharePoint service
parent: Services
---

# SharePoint service

SharePoint service pushes data, such as form submissions, to SharePoint lists owned by tenant teams, and uploads files to a document library on the team's site. Each team keeps its data in its own SharePoint site and works with it there. ADSP only writes: it never reads list rows back and stores none of the data it pushes.

The service signs in to Microsoft Entra ID with the team's own app registration and writes through the Microsoft Graph API. [Form service](form-service.md) uses it to send each submitted form to a SharePoint list, and other applications can call it directly.

## Client roles

client `urn:ads:platform:sharepoint-service`

| name              | description                                                                                                                                                                                               |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sharepoint-admin  | Administrator role for setting SharePoint connection credentials, and for testing, verifying and setting up destinations. Included in the tenant admin role.                                              |
| sharepoint-writer | Role for services that push data and files to SharePoint destinations. The form service account has it as a core service account; grant it to a tenant service account to push from your own application. |

## Tenancy

- **Which tenant is used.** Tenant users and service accounts act on the tenant of their token. Core (platform) service accounts with `sharepoint-writer`, such as form service, set the `tenantId` query parameter to choose the tenant. Without it the request responds 400.
- **Configuration.** Connections and destinations are tenant configuration in the [configuration service](configuration-service.md) under `platform:sharepoint-service`. The service uses only the tenant's own configuration; there are no platform connections or destinations.
- **Secrets.** Each connection's client secret is stored by SharePoint service, encrypted and bound to the tenant and connection. It never appears in configuration, and the API can't read it back.
- **Isolation.** A destination ID of another tenant responds 404, not 403. Setting a secret for a connection that isn't in the tenant's configuration responds 404, and reading its status reports no secret.
- **Role scope.** `sharepoint-admin` must be held in the tenant; core users can't use the admin endpoints. `sharepoint-writer` is accepted in the tenant or from a core service account.

## API overview

All endpoints are under `/sharepoint/v1` on the SharePoint service host and require a bearer token. Look up the host in the [directory service](directory-service.md) by the service URN `urn:ads:platform:sharepoint-service`, rather than hard coding it, as the code examples below do. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                                       | Purpose                                                                                      | Required role       |
| :------------------------------------------------------------- | :------------------------------------------------------------------------------------------- | :------------------ |
| `GET /sharepoint/v1/connections/{connectionId}/credentials`    | Check whether the connection has a client secret, and when it was set. Never the secret.     | `sharepoint-admin`  |
| `PUT /sharepoint/v1/connections/{connectionId}/credentials`    | Set the connection's client secret.                                                          | `sharepoint-admin`  |
| `DELETE /sharepoint/v1/connections/{connectionId}/credentials` | Delete the connection's client secret.                                                       | `sharepoint-admin`  |
| `POST /sharepoint/v1/destinations/{destinationId}/data`        | Write data as a row in the destination's list, and its repeating items in detail lists.      | `sharepoint-writer` |
| `POST /sharepoint/v1/destinations/{destinationId}/files`       | Upload files from file service to the document library, then write the row with their links. | `sharepoint-writer` |
| `POST /sharepoint/v1/destinations/{destinationId}/test`        | Push test data through the same logic as a real push, and report the result.                 | `sharepoint-admin`  |
| `POST /sharepoint/v1/destinations/{destinationId}/verify`      | Check that the lists, columns and document library the destination needs exist.              | `sharepoint-admin`  |
| `POST /sharepoint/v1/destinations/{destinationId}/setup`       | Create the missing detail lists, document library and columns, and index the key columns.    | `sharepoint-admin`  |

Connections and destinations have no endpoints in SharePoint service. Manage them in the tenant management webapp under SharePoint service, or through the [configuration service](configuration-service.md) API.

## Concepts

### Connection

A connection is one SharePoint site and the Microsoft Entra app registration that can write to it. It has an `id`, a `name`, the `entraTenantId` and `clientId` of the app registration, and the `siteId` of the site. Its client secret is set separately, through the credentials endpoint or the connection form in the tenant management webapp.

Each team owns its own site and app registration. The site owner prepares them:

- The app registration needs the Microsoft Graph `Sites.Selected` application permission and a `write` grant on the site.
- Creating detail lists, a document library and columns from ADSP (setup) needs an `owner` or `fullcontrol` grant. With `write`, setup reports what the site owner has to create instead.
- Secret expiry is the team's responsibility. When the secret expires, pushes fail with an `entra:AADSTS` error code until a new secret is set.

### Destination

A destination is a list on a connection's site, and how data is written to it:

- `connectionId` and `listId`: the connection and the SharePoint list.
- `fieldMappings`: each mapping copies the value at a data path (`source`) to a list column (`target`, the column's internal name). A mapping can also set `columnType` (`text`, `multilineText`, `number`, `dateTime`, `boolean`, `multiChoice` or `hyperlink`), `displayName` and `choices`, which setup uses to create the column and verify uses to check it.
- `idempotencyFields`: how a row is identified so that a push updates it instead of adding another (see [Row identity](#row-identity)). Shown as "Update existing rows" in the tenant management webapp.
- `enabled`: a disabled destination refuses pushes with `destination-disabled`. Test still works.
- `folderLinkField`: an optional column that gets a link to the folder of the submission's files.
- `documentFilesLibraryId` or `documentFilesLibraryName`: the document library that files are uploaded to (see [Files](#files)).
- `detailLists`: lists for repeating items (see [Detail lists](#detail-lists)).

Data paths use `.` for fields and `[n]` or `.n` for array items, for example `applicant.firstName` or `dependents[0].name`. An array of text or numbers, such as a multi-select answer, fills a choice column that allows multiple selections.

### Row identity

When `idempotencyFields` is `["_adsp.key"]` (the default for new destinations), the caller sends a unique key with the data as `_adsp: { key }`, for example a submission ID. SharePoint service writes the key to the `AdspItemKey` column, and a later push with the same key updates that row. This makes a push safe to repeat. The list needs `AdspItemKey` as an indexed single line of text column, which setup can create.

Without `idempotencyFields`, every push adds a row. Other data paths can be set in `idempotencyFields` through the configuration service, for callers that can't send `_adsp.key`; their values are joined to form the key.

### Detail lists

A detail list holds a repeating section of the data, such as household members, as rows of a second list. Each has a `listId` (or a `listName` until setup creates it), a `dataPath` to the array in the data, a `parentRefField` column, and mappings relative to each item.

After the main row is written, each array item becomes a row in the detail list, with `parentRefField` set to the main row's item ID. When a push updates the main row, the new detail rows are written first and the old ones deleted after, so the list never mixes old and new items. A destination with detail lists needs row identity, and an array can have at most 100 items.

### Files

`POST /sharepoint/v1/destinations/{destinationId}/files` reads up to 20 files from [file service](file-service.md) and uploads each one to the destination's document library, under a folder named after the `submissionId`. It then writes `data` as a row with each file's link at its `field`. The row is written only when every file uploaded, so the whole request can be repeated: files are overwritten by path, and the row is updated when its key matches.

Files go to the site's Documents library unless the destination sets `documentFilesLibraryId`. With only `documentFilesLibraryName`, setup creates a library with that name, and file pushes fail with `destination-not-set-up` until its ID is saved. A library that was deleted, or an ID that belongs to an ordinary list, fails the request before any file is uploaded, with `document-library-not-found` or `not-a-document-library`.

With `updateRowOnly: true`, the request only sets the columns in `data` on the row that already has the key, and leaves detail lists alone. Form service uses this to add the submission PDF's link to the row its submission push wrote. The row write fails with `row-not-found`, which is retryable, when no row has the key yet.

### Test, verify and setup

- **Test** writes test data as a real row, so use data that is safe to keep or delete. It also checks the document library, but uploads no files. It reports `ok` and the outcome, or the error code and column that failed.
- **Verify** reads the column definitions of the destination's lists, never their rows, and reports each list and column as `ok`, `missing`, `notIndexed` or `wrongType`. It also reports the document library's status when the destination sets one.
- **Setup** creates the detail lists and the document library that have only a name, adds missing columns and indexes the key columns. It never changes or deletes existing columns, and never takes over an existing list or library with the same name.

These, and saving a secret, read the tenant's configuration fresh, so they use a connection or destination saved a moment before. Pushes use the cached configuration, which is refreshed when the configuration changes.

### Errors and retries

Failures from Microsoft are returned as `errorCode`, with `retryable` saying whether a later attempt may succeed:

- `entra:AADSTS<code>`: Microsoft Entra sign-in failed, for example an expired or wrong secret.
- `graph:<code>`: Microsoft Graph failed, for example `graph:accessDenied` when the app has no grant on the site. `column` names the rejected column when Graph reports one.
- `file:<code>`: a file could not be read from file service, for example `file:not-ready` while it is still being scanned.
- `network` or `unknown`: there was no response.

The service retries calls to Microsoft that fail with throttling (429), 503, 504 or a network error, up to 3 times within the request. Longer outages are the caller's to retry, using `retryable`. Because a push with row identity is safe to repeat, retrying the whole request is the recommended way to recover.

Data values never appear in responses, events or logs.

### Form service integration

A form definition sends its submitted forms to a SharePoint destination when it sets `sharepointConfigurationId` to the destination ID. In the tenant management webapp, this is the SharePoint destination on the form definition's Lifecycle tab.

- After each submit, form service pushes the form data to the destination, with `_adsp: { key, formId, submittedAt }`. The key is the submission ID, or the form ID when the definition has no submission records. Forms with files use the files endpoint, so the files are uploaded and linked in the same row.
- When the definition generates a submission PDF, form service pushes it once PDF service has generated it, as a link at `_adsp.submissionPdf` on the same row. Map that path to a hyperlink column to show it; the mapping generator adds a Submission PDF column for it. This needs a destination that updates existing rows; otherwise the PDF push fails with `row-identity-missing`.
- The push happens after the submit response, so the applicant is never affected by it. Dry runs are not pushed.
- Form service retries a failed push that may pass after 1 minute, 5 minutes, 30 minutes and 2 hours. When the retries run out, or the failure can't be fixed by retrying, it sends the `form-service:sharepoint-push-failed` event with the form, submission and destination IDs, the error code, and the `part` that didn't arrive: `submission` or `submission-pdf`.
- The tenant management webapp can generate a destination's field mappings from a form definition's data schema.

### Matching a row to a form

When the destination updates existing rows (the default), a row's `AdspItemKey` for a push from form service is the submission ID when the form definition has "Create submission records on submit" turned on ("Creates submissions" in the form admin app), and the form ID otherwise. "Allow multiple forms per applicant" ("Multiple forms") doesn't change this.

- **With submission records**, each submit adds a row. A form that is set back to draft and submitted again adds another row, and the earlier row stays.
- **Without submission records**, each form has one row, and submitting it again updates that row.

With "Update existing rows" turned off, no key is written: every submit adds a row, `AdspItemKey` stays empty, and the submission PDF isn't linked.

When the push has files, the same ID names the submission's folder in the document library, and the destination's files folder link column (`folderLinkField`) opens it.

To find the form of a row, export the form definition in the tenant management webapp under Form service, Export. The export lists Submissions or Forms, depending on the same setting, and its `id` column, a standard property that is selected by default, equals `AdspItemKey`. Columns that setup adds may not be in the list's default view; show `AdspItemKey` in SharePoint with **+ Add column** > **Show/hide columns**.

## Events

SharePoint service sends these domain events in the `sharepoint-service` namespace, so tenant administrators can subscribe notifications to what they have to act on. They aren't sent for every push; the [audit actions](#audit-actions) record what was sent. Payloads hold IDs and error codes only, never form data, file names, links or Microsoft messages.

| event                | sent when                                                                                                                                           | payload                                                                                       |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `credential-set`     | A connection's secret is saved.                                                                                                                     | `connectionId`, `updatedBy`                                                                   |
| `credential-deleted` | A saved secret is deleted.                                                                                                                          | `connectionId`, `deletedBy`                                                                   |
| `push-failed`        | A row can't be written and a retry won't fix it, for example an unknown or disabled destination, a missing or rejected secret, or a missing column. | `destinationId`, `errorCode`, `column` when Graph names one, `dataId` when detail rows failed |
| `file-upload-failed` | Files in a files request can't be uploaded and a retry won't fix it. One event per request.                                                         | `destinationId`, `submissionId`, `files: [{ field, fileId, errorCode }]`                      |

`push-failed` uses the data's `_adsp.key` as the correlation ID, and `file-upload-failed` the submission ID. Failures a retry can fix, such as throttling or an outage, send no event, since the caller retries them. Test, verify and setup send no events, because the administrator sees the result straight away.

SharePoint service doesn't consume any events.

## Audit actions

SharePoint service records audit events in the `sharepoint-service` namespace of the [audit service](audit-service.md), in the tenant of the connection or destination. The resource is `{ type: 'sharepoint-connection', id: <connection ID> }` for secrets and `{ type: 'sharepoint-destination', id: <destination ID> }` for everything else. Entries never hold the secret, form data, file names, links or Microsoft messages. All actions are version 1.

| action               | category       | severity | retention class | recorded when                                                                                                                             |
| :------------------- | :------------- | :------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| credential.set       | security       | info     | security        | A secret is saved, for the first time or as a replacement, with the `connectionId` and `keyVersion`.                                      |
| credential.deleted   | security       | warning  | security        | A saved secret is deleted, with the `connectionId`.                                                                                       |
| data.pushed          | data-access    | info     | compliance      | A row is created or updated, with the `connectionId`, `sharepointItemId`, `outcome`, and `detailRowsFailed` when some detail rows failed. |
| file.pushed          | data-access    | info     | compliance      | A file is uploaded, with the `connectionId`, `submissionId`, `field`, `fileId`, `sharepointFileId` and `size`.                            |
| destination.tested   | administrative | info     | compliance      | Test writes its data as a row, with the same metadata as `data.pushed`.                                                                   |
| destination.verified | administrative | info     | compliance      | Verify checks the lists and columns, with the `connectionId` and `ready`.                                                                 |
| destination.set-up   | administrative | info     | compliance      | Setup runs, with the `connectionId`, the counts of created lists, created columns, indexed columns and failures, and `permissionDenied`.  |

The actor is the signed-in administrator for secrets and destination actions, and the calling account, such as the form service account, for pushes. Row entries use the data's `_adsp.key` as the correlation ID, so callers must use IDs, not personal information, as the key. File entries use the submission ID.

Entries are recorded once SharePoint has been changed or checked. Requests that change nothing record nothing: rejected requests, failed files and rows, a test that wrote no row, and deleting a secret that wasn't set. Audit failures are logged and do not fail the request. The SharePoint service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the SDK environment variable `AUDIT_ENABLED=false` on SharePoint service to turn it off.

## Code examples

### Configure a connection and a destination

Connections and destinations are configured using the [configuration service](configuration-service.md).

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const request = {
  operation: 'UPDATE',
  update: {
    connections: {
      'intake-site': {
        id: 'intake-site',
        name: 'Intake site',
        entraTenantId: '2bb51c06-af9b-42c5-8bf5-3c3b7b10850b',
        clientId: '9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f',
        siteId: 'contoso.sharepoint.com,0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f,1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      },
    },
    destinations: {
      'grant-applications': {
        id: 'grant-applications',
        name: 'Grant applications',
        connectionId: 'intake-site',
        listId: '6b1e7c2d-4f3a-4e8b-9c0d-1a2b3c4d5e6f',
        fieldMappings: [
          { source: 'applicant.firstName', target: 'FirstName', columnType: 'text' },
          { source: 'applicant.lastName', target: 'LastName', columnType: 'text' },
          { source: 'requestedAmount', target: 'RequestedAmount', columnType: 'number' },
        ],
        idempotencyFields: ['_adsp.key'],
        enabled: true,
      },
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/sharepoint-service`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
});
```

`UPDATE` replaces each top level key, so include every connection and destination that should remain.

### Set the client secret

```typescript
const directoryResponse = await fetch(
  'https://directory-service.adsp.alberta.ca/directory/v2/namespaces/platform/services/sharepoint-service',
);
const { host: sharepointServiceUrl } = await directoryResponse.json();

const response = await fetch(`${sharepointServiceUrl}/sharepoint/v1/connections/intake-site/credentials`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ clientSecret }),
});
// For example { isSet: true, updatedAt: '2026-11-18T17:24:05.112Z' }
const { isSet } = await response.json();
```

### Verify and set up a destination

```typescript
const verify = await fetch(`${sharepointServiceUrl}/sharepoint/v1/destinations/grant-applications/verify`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { ready, lists } = await verify.json();

if (!ready) {
  const setup = await fetch(`${sharepointServiceUrl}/sharepoint/v1/destinations/grant-applications/setup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // Save the ID of each created detail list, and of the created document library, on the destination.
  const { createdLists, createdLibrary, failures, permissionDenied } = await setup.json();
}
```

### Push data

A service account with `sharepoint-writer` pushes the data. Send a key so that a repeated push updates the same row.

```typescript
const response = await fetch(`${sharepointServiceUrl}/sharepoint/v1/destinations/grant-applications/data`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicant: { firstName: 'Test', lastName: 'User' },
    requestedAmount: 5000,
    _adsp: { key: applicationId },
  }),
});

if (response.ok) {
  // For example { dataId: '42', outcome: 'created', date: '2026-11-18T17:30:12.418Z' }
  const { dataId, outcome } = await response.json();
} else if (response.status === 502) {
  const { errorCode, retryable } = await response.json();
  // Repeat the push later when retryable is true.
}
```

### Push files with data

```typescript
const response = await fetch(`${sharepointServiceUrl}/sharepoint/v1/destinations/grant-applications/files`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    submissionId: applicationId,
    files: [{ field: 'proofOfIncome', fileId: 'urn:ads:platform:file-service:v1:/files/64f1c2a3b4c5d6e7f8a9b0d1' }],
    data: {
      applicant: { firstName: 'Test', lastName: 'User' },
      _adsp: { key: applicationId },
    },
  }),
});
// Each file has status 'uploaded' or 'failed'; row is present when data was written or failed to write.
const { files, row } = await response.json();
```
