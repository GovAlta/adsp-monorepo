import { useCallback, useEffect, useRef, useState } from 'react';
import {
  toFileServiceError,
  type FileMetadata,
  type FileServiceError,
  type FileTypeInfo,
  type IFileUploadClient,
} from '@abgov/adsp-components-core';

export interface UseFileUploadOptions {
  /** Associates uploaded files with a record in the application, such as a form submission. */
  recordId?: string;
  /** Called once File service has accepted a file. */
  onUpload?: (file: FileMetadata) => void;
}

export type FileUploadStatus = 'idle' | 'uploading' | 'uploaded' | 'failed';

export interface UseFileUploadResult {
  /** The File Type, once loaded. Loading it confirms that it exists and that the user may use it. */
  fileType: FileTypeInfo | null;
  loading: boolean;
  status: FileUploadStatus;
  /** The file selected for the current or last upload. */
  selectedFile: File | null;
  /** Fraction of the content sent, from 0 to 1. */
  progress: number;
  /** The file as File service stored it, after a successful upload. */
  uploaded: FileMetadata | null;
  /** Why the File Type couldn't be loaded, or why the upload failed. File service's answer is authoritative. */
  error: FileServiceError | null;
  /** True when upload() can start: the File Type loaded and no upload is running. */
  ready: boolean;
  upload: (file: File) => Promise<void>;
  /** Repeats whatever failed: loading the File Type, or uploading the same file. */
  retry: () => void;
  /** Stops any upload in progress and clears the last one. An uploaded file stays in File service. */
  reset: () => void;
}

type ErrorSource = 'type' | 'upload';

const isAbort = (err: unknown) => err instanceof Error && err.name === 'AbortError';

// The client must be stable across renders (create it once or memoize it). Nothing is requested without a client.
export function useFileUpload(
  client: IFileUploadClient | undefined,
  fileTypeId: string,
  { recordId, onUpload }: UseFileUploadOptions = {},
): UseFileUploadResult {
  const [fileType, setFileType] = useState<FileTypeInfo | null>(null);
  const [loading, setLoading] = useState(!!client && !!fileTypeId);
  const [status, setStatus] = useState<FileUploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<{ error: FileServiceError; source: ErrorSource } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const active = useRef<AbortController | null>(null);
  const onUploadRef = useRef(onUpload);
  onUploadRef.current = onUpload;

  const stop = useCallback(() => {
    active.current?.abort();
    active.current = null;
  }, []);

  // A new client or File Type starts over; an upload to the old one is cancelled rather than reported against the new.
  useEffect(() => {
    stop();
    setFileType(null);
    setError(null);
    setStatus('idle');
    setSelectedFile(null);
    setUploaded(null);
    setProgress(0);

    if (!client || !fileTypeId) {
      setLoading(false);
      return;
    }

    let current = true;
    setLoading(true);
    client
      .getFileType(fileTypeId)
      .then((type) => {
        if (current) {
          setFileType(type);
        }
      })
      .catch((err: unknown) => {
        if (current) {
          setError({ error: toFileServiceError(err), source: 'type' });
        }
      })
      .finally(() => {
        if (current) {
          setLoading(false);
        }
      });

    return () => {
      current = false;
    };
  }, [client, fileTypeId, reloadCount, stop]);

  // Unmounting cancels an upload in progress.
  useEffect(() => stop, [stop]);

  const upload = useCallback(
    async (file: File) => {
      if (!client || !fileTypeId || active.current) {
        return;
      }

      const controller = new AbortController();
      active.current = controller;
      setSelectedFile(file);
      setUploaded(null);
      setError(null);
      setProgress(0);
      setStatus('uploading');

      try {
        const result = await client.uploadFile(fileTypeId, file, {
          recordId,
          signal: controller.signal,
          onProgress: (fraction) => {
            if (!controller.signal.aborted) {
              setProgress(fraction);
            }
          },
        });
        if (controller.signal.aborted) {
          return;
        }
        setUploaded(result);
        setProgress(1);
        setStatus('uploaded');
        onUploadRef.current?.(result);
      } catch (err) {
        // A cancelled upload isn't a failure, and whatever cancelled it has already set the state.
        if (controller.signal.aborted || isAbort(err)) {
          return;
        }
        setError({ error: toFileServiceError(err), source: 'upload' });
        setStatus('failed');
      } finally {
        if (active.current === controller) {
          active.current = null;
        }
      }
    },
    [client, fileTypeId, recordId],
  );

  const reset = useCallback(() => {
    stop();
    setStatus('idle');
    setSelectedFile(null);
    setUploaded(null);
    setProgress(0);
    setError((current) => (current?.source === 'upload' ? null : current));
  }, [stop]);

  const retry = useCallback(() => {
    if (error?.source === 'type') {
      // Set now rather than in the effect, so the render after the click already shows the reload.
      setError(null);
      setLoading(true);
      setReloadCount((count) => count + 1);
    } else if (selectedFile) {
      void upload(selectedFile);
    }
  }, [error, selectedFile, upload]);

  return {
    fileType,
    loading,
    status,
    selectedFile,
    progress,
    uploaded,
    error: error?.error ?? null,
    ready: !!client && !!fileType && status !== 'uploading',
    upload,
    retry,
    reset,
  };
}
