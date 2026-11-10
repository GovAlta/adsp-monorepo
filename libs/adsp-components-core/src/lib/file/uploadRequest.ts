import { toStatusError } from './mapper';

export interface UploadRequest {
  xhr: XMLHttpRequest;
  url: string;
  token?: string;
  body: FormData;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

const abortError = () => new DOMException('The upload was cancelled.', 'AbortError');

// Sends a multipart upload and resolves with the parsed JSON response; File service errors reject as FileServiceError.
export function sendUpload({ xhr, url, token, body, onProgress, signal }: UploadRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const settle = (action: () => void) => {
      signal?.removeEventListener('abort', onAbort);
      action();
    };

    xhr.open('POST', url);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };

    xhr.onload = () =>
      settle(() => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(toStatusError(xhr.status, undefined, 'File upload'));
          }
        } else {
          reject(toStatusError(xhr.status, xhr.responseText, 'File upload'));
        }
      });
    xhr.onerror = () => settle(() => reject(new TypeError('File upload failed: network error.')));
    xhr.onabort = () => settle(() => reject(abortError()));

    xhr.send(body);
  });
}
