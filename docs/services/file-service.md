---
layout: page
title: File service
nav_order: 8
parent: Services
---

# File service
File service provides the ability to upload and download files. Applications can upload files via multipart/form-data requests with the file and related metadata, then later allow users to access metadata of or download the file.

The file service uses anti-virus services to scan uploaded files. Download of files that have not been scanned requires an explicit `unsafe=true` parameter.


## Client roles
client `urn:ads:platform:file-service`

| name | description |
|:-|:-|
| file-service-admin | Administrator role for the file service. This role grants read and write access across all files.  |

File access is controlled by configuration of `readRoles` and `updateRoles` on each file type.

## Concepts
### File type
File type represents a category of files with specific access roles. For example, a 'Supporting Documents' file type may allow `intake-application` role to upload files and `assessor` role to download the files. File types are configured in the [configuration service](configuration-service.md) under the `platform:file-service` namespace and name.

### File
A file represents an uploaded file and consists of a minimal metadata record and the actual file that was uploaded. File service provides minimal metadata and does not support extensible metadata; keep additional values in a domain record and reference it using `recordId`.

## Audit actions
File service records audit events in the `file-service` namespace of the [audit service](audit-service.md). Records are written to the tenant of the file, with the file as the resource (`{ type: 'file', id: <file ID>, name: <filename> }`), the `recordId` of the file as the correlation ID, and the `filename`, file `type`, `recordId` and `size` in the metadata. All actions are version 1.

| action | category | severity | retention class | recorded when |
|:-|:-|:-|:-|:-|
| file.uploaded | data-access | info | compliance | A file is uploaded, even while its virus scan is pending, or a file is copied (with `sourceFileId` in the metadata). |
| file.downloaded | data-access | info | compliance | A scanned file is downloaded. A partial (range) download includes the `range` in the metadata. |
| file.unsafe-downloaded | data-access | warning | security | A file is downloaded with `unsafe=true` before its virus scan is completed. |
| file.deleted | administrative | warning | compliance | A file is deleted through the API, or by the retention job (with `reason: 'retention'` and `retentionDays` in the metadata). |
| file.scan-completed | runtime | info | standard | The virus scan result of a file is recorded, with `scanResult` of `clean` or `threat`. |
| file.scan-threat-found | security | critical | security | The virus scan detects a threat. Threat names are included as `threats` when the anti-virus provider reports them. |

Downloads of files of an `anonymousRead` type by users who are not signed in are recorded with the actor `{ id: 'anonymous', type: 'user' }`. Scan results and retention deletes are recorded with the system actor `file-service-job`. Scan results are recorded when the asynchronous scan completes, not when the file is uploaded.

Changes to file types are not recorded by file service, since file types are managed in the [configuration service](configuration-service.md); audit records of those changes are in the `configuration-service` namespace.

Downloads can be high volume, so file service sends audit events in batches of up to 100 events. Audit failures are logged by the SDK and do not fail the file operation. The file service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

## Code examples
### Configure a file type
File types are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
  const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
  const request = {
    operation: 'UPDATE',
    update: {
      'supporting-document': {
        id: 'supporting-document',
        name: 'Support Document',
        anonymousRead: false,
        readRoles: ['assessor'],
        updateRoles: ['applicant'],
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v2/configuration/platform/file-service`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```

### Upload a file
```typescript
  // Note that the file needs to be last.
  const formData = new FormData();
  formData.append('type', 'supporting-docs');
  // Use filename to override the original name of the file.
  formData.append('filename', 'proof-of-income.pdf');
  // Use recordId to reference the associated record.
  formData.append('recordId', '8bcbc6b1-600a-40c5-99c8-d02734f97ca5');
  formData.append('file', selectedFile);

  await fetch(
    'https://file-service.adsp.alberta.ca/file/v1/files',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );
```

Note that file service requires an authenticated user for uploads. In order to allow public upload, proxy the request and add service account access token in the server.

```typescript
  app.use(
    '/api/upload',
    proxy('https://file-service.adsp.alberta.ca', {
      proxyReqPathResolver: function() {
        return '/file/v1/files';
      },
      proxyReqOptDecorator: async (proxyReq) => {
        const accessToken = await getServiceAccountToken();
        proxyReq.headers['Authorization'] = `Bearer ${accessToken}`;
        return proxyReq;
      },
    })
  );
```

### Find files
```typescript
  const top = 10;
  const criteria = { typeEquals: 'supporting-docs' };
  await fetch(
    `${fileServiceUrl}/file/v1/files?top=${top}&criteria=${JSON.stringify(criteria)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
```

### Get file metadata
```typescript
  const response = await fetch(
    `${fileServiceUrl}/file/v1/files/84401bb2-1f49-42ef-92b0-649e6c0e7462`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const {
    typeName,
    filename,
    size,
    recordId,
  } = await response.json();
```

### Download a file
```typescript
  await fetch(
    `${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6/download`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
```

Use `unsafe=true` to download a file before it has been virus scanned.

```typescript
  await fetch(
    `${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6/download?unsafe=true`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
```

### Delete a file
```typescript
  await fetch(
    `${fileServiceUrl}/file/v1/files/a217db73-0c29-4fbd-b576-49d049f855a6`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
```
