---
layout: page
title: File service
nav_order: 7
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
File type represents a category of files with specific access roles. For example, a 'Supporting Documents' file type may allow `intake-application` role to upload files and `assessor` role to download the files.

### File
A file represents an uploaded file and consists of a minimal metadata record and the actual file that was uploaded. File service provides minimal metadata and does not support extensible metadata; keep additional values in a domain record and reference it using `recordId`.

## Code examples

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
    'https://file-service.alpha.alberta.ca/file/v1/files',
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
    proxy('https://file-service.alpha.alberta.ca', {
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
