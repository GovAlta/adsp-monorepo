# File service client

`FileClient` reads files from the ADSP File service for the File service components, `ADSPFileDownload` and `ADSPFileUpload` in `@abgov/adsp-components-react`.

```ts
import { FileClient } from '@abgov/adsp-components-core';

const client = new FileClient({
  serviceUrl: 'https://file-service.adsp.alberta.ca',
  getAccessToken, // the application's own; omit for anonymous access
});

const file = await client.getFile(fileId); // FileMetadata
const { blob, filename, mimeType } = await client.downloadFile(fileId);

const type = await client.getFileType('my-file-type'); // FileTypeInfo
const uploaded = await client.uploadFile('my-file-type', file, { recordId, onProgress, signal }); // FileMetadata
```

## Options

| Option           | Description                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `serviceUrl`     | Root URL of the File service, usually from the directory (`urn:ads:platform:file-service`).                 |
| `getAccessToken` | Returns the user's token. Without one, requests are anonymous and only work for types with `anonymousRead`. |
| `fetch`          | Replaces `globalThis.fetch`, for tests.                                                                     |
| `createXhr`      | Replaces `new XMLHttpRequest()` for uploads, for tests.                                                     |

## Behaviour

- **`getFile(fileId)`** calls `GET /file/v1/files/{fileId}`. It returns the filename, size, type and scan state. File service applies the same access check here as for the download, so a 403 means the download would fail too.
- **`downloadFile(fileId)`** calls `GET /file/v1/files/{fileId}/download`. It returns the content as a `Blob`, and the filename from File service's `Content-Disposition` header (RFC 5987 `filename*`, then `filename`). A browser on another origin can't read that header unless File service exposes it through CORS, so without it the client asks `getFile` for the filename, and uses the file ID if that fails too.
- **It never sends `unsafe=true`.** A file whose virus scan hasn't finished fails with `scan-pending`. Bypassing the scan is a decision for the application, not the component.
- **`getFileType(fileTypeId)`** calls `GET /file/v1/types/{fileTypeId}` and returns its ID, name, `anonymousRead` and `allowedFileTypes` (extensions such as `.pdf`; empty means any format). File service answers 403 when the user may not use the type, so loading it tells a component before any upload whether to offer one.
- **`uploadFile(fileTypeId, file, options)`** calls `POST /file/v1/files` as multipart form data. `type`, `filename`, `mimeType` and `recordId` go before the file part, because File service reads them while the file streams in. It uses `XMLHttpRequest`, not `fetch`, so `onProgress` can report the fraction sent; aborting `signal` cancels the upload and rejects with an `AbortError`. The stored file comes back with `scanned: false`, since the virus scan runs afterwards.
- **Errors** are `FileServiceError`s with a `reason`, the HTTP `status` and `retryable`:

| Response                                  | `reason`             | `retryable` |
| ----------------------------------------- | -------------------- | ----------- |
| 404                                       | `not-found`          | no          |
| 401                                       | `unauthenticated`    | no          |
| 403                                       | `forbidden`          | no          |
| 400 `File scan pending.`                  | `scan-pending`       | yes         |
| 400 `Invalid file type extension`         | `unsupported-format` | no          |
| 400 for anything else (infected, deleted) | `unavailable`        | no          |
| 5xx                                       | `unexpected`         | yes         |

A network failure rejects with the error `fetch` threw; `toFileServiceError` turns it into `unexpected`. `getFileErrorMessage(reason)` gives the text components show for each reason, and `getFileUnavailableReason(file)` tells from metadata alone that a download would fail (infected, or scan pending).

For uploads, `getFileUploadErrorMessage(reason)` gives the upload wording: 404 means the File Type doesn't exist, a format the File Type doesn't allow is `unsupported-format`, and any other 400 (such as an invalid filename) is `unavailable`. `isFileFormatAllowed(filename, allowedFileTypes)` repeats File service's extension check so a component can reject a file before sending it, and `formatAllowedFileTypes` words the list for guidance.

## Limitations

- **File Types have no allowed formats or size limit in File service configuration**, so the client can't return any. Client-side checks are limited to File service's own 3 GB upload limit.

- **The whole file is held in memory** as a `Blob` before the browser saves it. A plain `<a href>` can't send the bearer token, so this is the only way to download a protected file. It suits documents; very large files would be better served by a direct link for `anonymousRead` types, which the client doesn't offer yet.
- **The 400 reasons are told apart by File service's message text**, because the service returns no error code. If the message changes, `scan-pending` would be reported as `unavailable`.
