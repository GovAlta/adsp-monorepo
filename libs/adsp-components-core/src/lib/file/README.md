# File service client

`FileClient` reads files from the ADSP File service for the File service components, starting with `ADSPFileDownload` in `@abgov/adsp-components-react`.

```ts
import { FileClient } from '@abgov/adsp-components-core';

const client = new FileClient({
  serviceUrl: 'https://file-service.adsp.alberta.ca',
  getAccessToken, // the application's own; omit for anonymous access
});

const file = await client.getFile(fileId); // FileMetadata
const { blob, filename, mimeType } = await client.downloadFile(fileId);
```

## Options

| Option           | Description                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `serviceUrl`     | Root URL of the File service, usually from the directory (`urn:ads:platform:file-service`).                 |
| `getAccessToken` | Returns the user's token. Without one, requests are anonymous and only work for types with `anonymousRead`. |
| `fetch`          | Replaces `globalThis.fetch`, for tests.                                                                     |

## Behaviour

- **`getFile(fileId)`** calls `GET /file/v1/files/{fileId}`. It returns the filename, size, type and scan state. File service applies the same access check here as for the download, so a 403 means the download would fail too.
- **`downloadFile(fileId)`** calls `GET /file/v1/files/{fileId}/download`. It returns the content as a `Blob`, and the filename from File service's `Content-Disposition` header (RFC 5987 `filename*`, then `filename`). A browser on another origin can't read that header unless File service exposes it through CORS, so without it the client asks `getFile` for the filename, and uses the file ID if that fails too.
- **It never sends `unsafe=true`.** A file whose virus scan hasn't finished fails with `scan-pending`. Bypassing the scan is a decision for the application, not the component.
- **Errors** are `FileServiceError`s with a `reason`, the HTTP `status` and `retryable`:

| Response                                  | `reason`          | `retryable` |
| ----------------------------------------- | ----------------- | ----------- |
| 404                                       | `not-found`       | no          |
| 401                                       | `unauthenticated` | no          |
| 403                                       | `forbidden`       | no          |
| 400 `File scan pending.`                  | `scan-pending`    | yes         |
| 400 for anything else (infected, deleted) | `unavailable`     | no          |
| 5xx                                       | `unexpected`      | yes         |

A network failure rejects with the error `fetch` threw; `toFileServiceError` turns it into `unexpected`. `getFileErrorMessage(reason)` gives the text components show for each reason, and `getFileUnavailableReason(file)` tells from metadata alone that a download would fail (infected, or scan pending).

## Limitations

- **The whole file is held in memory** as a `Blob` before the browser saves it. A plain `<a href>` can't send the bearer token, so this is the only way to download a protected file. It suits documents; very large files would be better served by a direct link for `anonymousRead` types, which the client doesn't offer yet.
- **The 400 reasons are told apart by File service's message text**, because the service returns no error code. If the message changes, `scan-pending` would be reported as `unavailable`.
