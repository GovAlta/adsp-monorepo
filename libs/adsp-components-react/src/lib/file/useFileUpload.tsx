import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileServiceError,
  isFileFormatAllowed,
  toFileServiceError,
  type FileMetadata,
  type FileTypeInfo,
  type IFileUploadClient,
} from '@abgov/adsp-components-core';

export interface UseFileUploadOptions {
  /** Associates uploaded files with a record in the application, such as a form submission. */
  recordId?: string;
  /** Called once for each file File service accepts. */
  onUpload?: (file: FileMetadata) => void;
}

export type FileUploadStatus = 'uploading' | 'uploaded' | 'failed';

export interface FileUploadItem {
  /** Identifies the upload for retry() and remove(); unique within the hook. */
  id: string;
  file: File;
  status: FileUploadStatus;
  /** Fraction of the content sent, from 0 to 1. All of it can be sent before File service answers. */
  progress: number;
  /** The file as File service stored it, after a successful upload. */
  uploaded: FileMetadata | null;
  /** Why the upload failed. File service's answer is authoritative. */
  error: FileServiceError | null;
}

export interface UseFileUploadResult {
  /** The File Type, once loaded. Loading it confirms that it exists and that the user may use it. */
  fileType: FileTypeInfo | null;
  loading: boolean;
  /** Why the File Type couldn't be loaded. */
  typeError: FileServiceError | null;
  /** True when upload() can start: the File Type has loaded. */
  ready: boolean;
  /** Every upload started since the last change of client, File Type or record, in the order selected. */
  uploads: FileUploadItem[];
  /** True while any upload is running. */
  uploading: boolean;
  /**
   * Uploads each file. A file in a format the File Type doesn't allow fails at once, without being sent.
   */
  upload: (files: File | readonly File[]) => void;
  /** Uploads a failed file again, when its error is retryable. */
  retry: (id: string) => void;
  /** Cancels the upload if it is running and takes it off the list. An uploaded file stays in File service. */
  remove: (id: string) => void;
  /** Loads the File Type again after it failed to load. */
  reloadType: () => void;
}

const isAbort = (err: unknown) => err instanceof Error && err.name === 'AbortError';

// The client must be stable across renders (create it once or memoize it). Nothing is requested without a client.
export function useFileUpload(
  client: IFileUploadClient | undefined,
  fileTypeId: string,
  { recordId, onUpload }: UseFileUploadOptions = {},
): UseFileUploadResult {
  const [fileType, setFileType] = useState<FileTypeInfo | null>(null);
  const [loading, setLoading] = useState(!!client && !!fileTypeId);
  const [typeError, setTypeError] = useState<FileServiceError | null>(null);
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  // Running uploads by item id.
  const active = useRef(new Map<string, AbortController>());
  const nextId = useRef(0);
  // The File Type uploads may go to: set only once it has loaded for the current client and fileTypeId.
  const loadedType = useRef<FileTypeInfo | null>(null);
  const onUploadRef = useRef(onUpload);
  onUploadRef.current = onUpload;

  const stopAll = useCallback(() => {
    active.current.forEach((controller) => controller.abort());
    active.current.clear();
  }, []);

  const update = useCallback((id: string, changes: Partial<FileUploadItem>) => {
    setUploads((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  // A new client or File Type starts over; an upload to the old one is cancelled rather than reported against the new.
  useEffect(() => {
    stopAll();
    loadedType.current = null;
    setFileType(null);
    setTypeError(null);
    setUploads([]);

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
          loadedType.current = { ...type, allowedFileTypes: type.allowedFileTypes ?? [] };
          setFileType(loadedType.current);
        }
      })
      .catch((err: unknown) => {
        if (current) {
          setTypeError(toFileServiceError(err));
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
  }, [client, fileTypeId, reloadCount, stopAll]);

  // Unmounting cancels any upload in progress.
  useEffect(() => stopAll, [stopAll]);

  // Files uploaded for one record must not be shown against the next, so a new recordId starts over.
  const firstRecord = useRef(true);
  useEffect(() => {
    if (firstRecord.current) {
      firstRecord.current = false;
      return;
    }
    stopAll();
    setUploads([]);
  }, [recordId, stopAll]);

  const send = useCallback(
    async (id: string, file: File) => {
      if (!client) {
        return;
      }

      const controller = new AbortController();
      active.current.set(id, controller);
      update(id, { status: 'uploading', progress: 0, error: null, uploaded: null });

      let result: FileMetadata;
      try {
        result = await client.uploadFile(fileTypeId, file, {
          recordId,
          signal: controller.signal,
          onProgress: (fraction) => {
            if (!controller.signal.aborted) {
              update(id, { progress: fraction });
            }
          },
        });
      } catch (err) {
        // A cancelled upload isn't a failure, and whatever cancelled it has already set the state.
        if (controller.signal.aborted || isAbort(err)) {
          return;
        }
        update(id, { status: 'failed', error: toFileServiceError(err) });
        return;
      } finally {
        if (active.current.get(id) === controller) {
          active.current.delete(id);
        }
      }

      if (controller.signal.aborted) {
        return;
      }
      update(id, { status: 'uploaded', progress: 1, uploaded: result });
      // File service has accepted the file, so a failing callback is the application's error, not a failed upload.
      onUploadRef.current?.(result);
    },
    [client, fileTypeId, recordId, update],
  );

  const upload = useCallback(
    (files: File | readonly File[]) => {
      const type = loadedType.current;
      if (!client || !fileTypeId || type?.id !== fileTypeId) {
        return;
      }

      const selected = Array.isArray(files) ? files : [files as File];
      const items: FileUploadItem[] = selected.map((file) => {
        nextId.current += 1;
        const allowed = isFileFormatAllowed(file.name, type.allowedFileTypes);
        return {
          id: `upload-${nextId.current}`,
          file,
          status: allowed ? 'uploading' : 'failed',
          progress: 0,
          uploaded: null,
          error: allowed
            ? null
            : new FileServiceError('unsupported-format', `${file.name} isn't in a format the File Type allows.`),
        };
      });

      setUploads((current) => [...current, ...items]);
      items.filter((item) => item.status === 'uploading').forEach((item) => void send(item.id, item.file));
    },
    [client, fileTypeId, send],
  );

  const retry = useCallback(
    (id: string) => {
      const item = uploads.find((candidate) => candidate.id === id);
      if (item?.status === 'failed' && item.error?.retryable && !active.current.has(id)) {
        void send(id, item.file);
      }
    },
    [uploads, send],
  );

  const remove = useCallback((id: string) => {
    active.current.get(id)?.abort();
    active.current.delete(id);
    setUploads((current) => current.filter((item) => item.id !== id));
  }, []);

  const reloadType = useCallback(() => {
    // Set now rather than in the effect, so the render after the click already shows the reload.
    setTypeError(null);
    setLoading(true);
    setReloadCount((count) => count + 1);
  }, []);

  return {
    fileType,
    loading,
    typeError,
    ready: !!client && !!fileType,
    uploads,
    uploading: uploads.some((item) => item.status === 'uploading'),
    upload,
    retry,
    remove,
    reloadType,
  };
}
