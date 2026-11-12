---
layout: page
title: File service
parent: Services
---

# File service

File service provides the ability to upload and download files. Applications can upload files via multipart/form-data requests with the file and related metadata, then later allow users to access metadata of or download the file.

The file service uses anti-virus services to scan uploaded files. Download of files that have not been scanned requires an explicit `unsafe=true` parameter.

## Client roles

client `urn:ads:platform:file-service`

| name               | description                                                                                                          |
| :----------------- | :------------------------------------------------------------------------------------------------------------------- |
| file-service-admin | Administrator role for the file service. This role grants read, upload and delete access to all files of the tenant. |

The role is included in the tenant admin composite role. Access to files is otherwise controlled by the `readRoles`, `updateRoles` and `anonymousRead` settings of each [file type](#file-type).

## Tenancy

- **Which tenant is used.** Tenant users and tenant service accounts act on the tenant of their token. Core (platform) users act on the tenant given by the `tenantId` query parameter. An invalid `tenantId` responds 400.
- **File types.** The file types of a tenant are its own types combined with the platform file types registered by platform services (for example `generated-pdf` from the [PDF service](pdf-service.md)). A platform type replaces a tenant type with the same ID. Files uploaded to a platform type belong to the tenant of the request.
- **Listing and uploading files.** `GET /file/v1/files` requires a tenant context, so core users must set `tenantId` or the request responds 400. Uploads to a platform type without a tenant context also respond 400. Core users who copy a file to another type set `tenantId` so the type is found in that tenant.
- **Single file requests.** `GET`, `DELETE` and `POST /file/v1/files/{fileId}` and the download find the file by ID across tenants, and check access against the tenant of the file. A file of another tenant responds 403 (401 for `DELETE /file/v1/files`) rather than 404, unless its type allows anonymous read.
- **Role scope.** `readRoles`, `updateRoles` and `file-service-admin` are checked in the tenant of the file. Core users and platform service accounts holding a role in the core realm are also allowed, for any tenant. Roles configured on tenant file types are only created in tenant realms, so platform service accounts need roles from the core realm (see the description of the file type schema in the [API documentation](https://api.adsp.alberta.ca)).
- **Uploader access.** The user who uploaded a file can always read it. Deleting it also requires one of the type's `updateRoles`.

## API overview

All endpoints are under `https://file-service.adsp.alberta.ca/file/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                               | Purpose                                  | Required role                                                                                            |
| :------------------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `GET /file/v1/types`                   | List the file types the user can access. | Any authenticated user; types are filtered by role                                                       |
| `GET /file/v1/types/{typeId}`          | Get a file type.                         | A `readRoles` or `updateRoles` role of the type, or `file-service-admin`, or the type is `anonymousRead` |
| `POST /file/v1/files`                  | Upload a file (multipart/form-data).     | An `updateRoles` role of the type, or `file-service-admin`                                               |
| `GET /file/v1/files`                   | Find files of the tenant, paged.         | Any authenticated user; files are filtered by access                                                     |
| `DELETE /file/v1/files?files=...`      | Mark several files for deletion.         | `file-service-admin`, or the uploader with an `updateRoles` role                                         |
| `GET /file/v1/files/{fileId}`          | Get the metadata of a file.              | Uploader, a `readRoles` role, `file-service-admin`, or anonymous for `anonymousRead` types               |
| `POST /file/v1/files/{fileId}`         | Run a file operation (`copy`).           | Read access to the file and an `updateRoles` role of the destination type, or `file-service-admin`       |
| `DELETE /file/v1/files/{fileId}`       | Mark a file for deletion.                | `file-service-admin`, or the uploader with an `updateRoles` role                                         |
| `GET /file/v1/files/{fileId}/download` | Download the file content.               | Same as getting the metadata                                                                             |

File types are configured through the [configuration service](configuration-service.md); file service has no endpoints of its own to change them.

## Concepts

### File type

File type represents a category of files with specific access roles. For example, a 'Supporting Documents' file type may allow `applicant` role to upload files and `assessor` role to download the files. File types are configured in the [configuration service](configuration-service.md) under the `platform:file-service` namespace and name.

| setting                  | effect                                                                                                                                                                                                  |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `readRoles`              | Users with one of these roles can read the metadata of and download any file of the type.                                                                                                               |
| `updateRoles`            | Users with one of these roles can upload files of the type, read the type, and delete files they uploaded.                                                                                              |
| `anonymousRead`          | Anyone, including requests without a bearer token, can read the metadata of and download files of the type. Embedded downloads of these files are sent with `Cache-Control: public`.                    |
| `allowedFileTypes`       | File extensions accepted for upload, with the leading period (for example `.pdf`). The extension is detected from the content when possible, otherwise taken from the filename. Empty accepts any file. |
| `securityClassification` | Data classification of files of the type: `public`, `protected a` (default), `protected b` or `protected c`. It is copied to each file.                                                                 |
| `rules.retention`        | When `active`, a daily job deletes files of the type that have not been accessed for `deleteInDays` days.                                                                                               |

Users with `file-service-admin` can read and delete every file of the tenant, and upload files of any type.

### File

A file represents an uploaded file and consists of a minimal metadata record and the actual file that was uploaded. File service provides minimal metadata and does not support extensible metadata; keep additional values in a domain record and reference it using `recordId`. Each file has a URN, `urn:ads:platform:file-service:v1:/files/{fileId}`, that the [directory service](directory-service.md) can resolve to its URL.

Deleting a file marks it for deletion; the file content and record are removed afterwards by a job. Files marked for deletion are not listed and cannot be downloaded.

### Upload

Files are uploaded with a `multipart/form-data` request with one file part named `file`, up to 3 GB, and at most 10 other fields. The metadata fields `type` (required), `recordId`, `filename` and `mimeType` must come before the file part, because the file is streamed to storage as it is received. They can also be sent as query parameters. The MIME type is detected from the content when possible, and `mimeType` is used otherwise.

### Virus scanning and digest

After a file is uploaded or copied, file service scans it for malware and computes a SHA-256 digest of its content (`digest`, for example `sha256-...`). Until the scan completes, `scanned` is `false` and a download responds 400 unless `unsafe=true` is set. Infected files cannot be downloaded.

### Download

A download responds with the file content and these headers:

- `Content-Type` is the MIME type of the file, or `application/octet-stream` if unknown. SVG images have `;base64` appended.
- `Content-Disposition` is `attachment` by default, or `inline` with `embed=true`, and includes the filename.
- `Cache-Control` is `no-store`, except `public` for embedded files of `anonymousRead` types.
- A single byte range in the `Range` header responds 206 with `Content-Range`. Multiple ranges and ranges outside the file respond 400.

## Events

File service sends these domain events in the `file-service` namespace. Each payload includes the `file` metadata, and the `correlationId` is the file's `recordId`, or its URN if it has none.

| event           | sent when                                                      | payload              |
| :-------------- | :------------------------------------------------------------- | :------------------- |
| `file-uploaded` | A file is uploaded or copied.                                  | `file`, `uploadedBy` |
| `file-deleted`  | A file is marked for deletion, by a user or the retention job. | `file`, `deletedBy`  |
| `file-scanned`  | The virus scan of a file completes.                            | `file`, `infected`   |

File service consumes its own `file-uploaded` and `file-deleted` events from a work queue to run the virus scan and digest, and to remove deleted files from storage. It also consumes configuration update events to refresh cached file types. The [cache service](cache-service.md) and [directory service](directory-service.md) use `file-deleted` to drop cached downloads and the file's resource entry.

## Audit actions

File service records audit events in the `file-service` namespace of the [audit service](audit-service.md). Records are written to the tenant of the file, with the file as the resource (`{ type: 'file', id: <file ID>, name: <filename> }`), the `recordId` of the file as the correlation ID, and the `filename`, file `type`, `recordId` and `size` in the metadata. All actions are version 1.

| action                 | category       | severity | retention class | recorded when                                                                                                                |
| :--------------------- | :------------- | :------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| file.uploaded          | data-access    | info     | compliance      | A file is uploaded, even while its virus scan is pending, or a file is copied (with `sourceFileId` in the metadata).         |
| file.downloaded        | data-access    | info     | compliance      | A scanned file is downloaded. A partial (range) download includes the `range` in the metadata.                               |
| file.unsafe-downloaded | data-access    | warning  | security        | A file is downloaded with `unsafe=true` before its virus scan is completed.                                                  |
| file.deleted           | administrative | warning  | compliance      | A file is deleted through the API, or by the retention job (with `reason: 'retention'` and `retentionDays` in the metadata). |
| file.scan-completed    | runtime        | info     | standard        | The virus scan result of a file is recorded, with `scanResult` of `clean` or `threat`.                                       |
| file.scan-threat-found | security       | critical | security        | The virus scan detects a threat. Threat names are included as `threats` when the anti-virus provider reports them.           |

Downloads of files of an `anonymousRead` type by users who are not signed in are recorded with the actor `{ id: 'anonymous', type: 'user' }`. Scan results and retention deletes are recorded with the system actor `file-service-job`. Scan results are recorded when the asynchronous scan completes, not when the file is uploaded.

Changes to file types are not recorded by file service, since file types are managed in the [configuration service](configuration-service.md); audit records of those changes are in the `configuration-service` namespace.

Downloads can be high volume, so file service sends audit events in batches of up to 100 events. Audit failures are logged by the SDK and do not fail the file operation. The file service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `FILE_AUDIT_ENABLED=false` on file service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `FILE_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Code examples

The examples use this base URL:

```typescript
const fileServiceUrl = 'https://file-service.adsp.alberta.ca';
```

### Configure a file type

File types are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const request = {
  operation: 'UPDATE',
  update: {
    'supporting-documents': {
      id: 'supporting-documents',
      name: 'Supporting Documents',
      anonymousRead: false,
      readRoles: ['assessor'],
      updateRoles: ['applicant'],
      allowedFileTypes: ['.pdf', '.jpg'],
      rules: { retention: { active: true, deleteInDays: 365 } },
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/file-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Upload a file

```typescript
// The metadata fields must come before the file.
const formData = new FormData();
formData.append('type', 'supporting-documents');
// Use filename to override the original name of the file.
formData.append('filename', 'proof-of-income.pdf');
// Use recordId to reference the associated record.
formData.append('recordId', '8bcbc6b1-600a-40c5-99c8-d02734f97ca5');
formData.append('file', selectedFile);

const response = await fetch(`${fileServiceUrl}/file/v1/files`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});

// scanned is false until the virus scan completes.
const { id, urn, scanned } = await response.json();
```

Note that file service requires an authenticated user for uploads. In order to allow public upload, proxy the request and add service account access token in the server.

```typescript
app.use(
  '/api/upload',
  proxy('https://file-service.adsp.alberta.ca', {
    proxyReqPathResolver: function () {
      return '/file/v1/files';
    },
    proxyReqOptDecorator: async (proxyReq) => {
      const accessToken = await getServiceAccountToken();
      proxyReq.headers['Authorization'] = `Bearer ${accessToken}`;
      return proxyReq;
    },
  }),
);
```

### Find files

```typescript
const top = 10;
const criteria = { typeEquals: 'supporting-documents', recordIdEquals: '8bcbc6b1-600a-40c5-99c8-d02734f97ca5' };
const response = await fetch(
  `${fileServiceUrl}/file/v1/files?top=${top}&criteria=${encodeURIComponent(JSON.stringify(criteria))}`,
  {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

// Pass page.next as the after parameter to get the next page.
const { results, page } = await response.json();
```

### Get file metadata

```typescript
const response = await fetch(`${fileServiceUrl}/file/v1/files/84401bb2-1f49-42ef-92b0-649e6c0e7462`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { typeName, filename, size, recordId, scanned, infected } = await response.json();
```

### Download a file

```typescript
const response = await fetch(`${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6/download`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const contentType = response.headers.get('Content-Type');
const content = await response.blob();
```

Use `unsafe=true` to download a file before it has been virus scanned, and `embed=true` to display it in the browser instead of saving it.

```typescript
await fetch(`${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6/download?unsafe=true`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### Copy a file

```typescript
const response = await fetch(`${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operation: 'copy', type: 'supporting-documents', filename: 'proof-of-income-copy.pdf' }),
});

const { id } = await response.json();
```

### Delete files

```typescript
await fetch(`${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Delete several files in one request.
const fileIds = ['a217db73-0c29-4fbd-b576-49d049f855a6', '84401bb2-1f49-42ef-92b0-649e6c0e7462'];
const response = await fetch(`${fileServiceUrl}/file/v1/files?files=${fileIds.join(',')}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { deleted, results } = await response.json();
```
