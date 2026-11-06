import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileServiceError,
  getFileErrorMessage,
  getFileUnavailableReason,
  toFileServiceError,
  type FileMetadata,
  type IFileClient,
} from '@abgov/adsp-components-core';
import { saveFile } from './saveFile';

export interface UseFileDownloadOptions {
  /** Load the file's metadata (name, size, scan state) up front. Defaults to true. */
  loadMetadata?: boolean;
}

export interface UseFileDownloadResult {
  /** The file's metadata, once loaded; always null when loadMetadata is false. */
  file: FileMetadata | null;
  loading: boolean;
  downloading: boolean;
  /** True when download() can start: there is a client and the metadata doesn't rule a download out. */
  ready: boolean;
  error: FileServiceError | null;
  /** Fetches the file through File service and saves it with the filename File service gives it. */
  download: () => Promise<void>;
  /** Repeats whatever failed: the metadata load, or the download. */
  retry: () => void;
}

type ErrorSource = 'metadata' | 'download';

// The client must be stable across renders (create it once or memoize it). Nothing is requested without a client.
export function useFileDownload(
  client: IFileClient | undefined,
  fileId: string,
  { loadMetadata = true }: UseFileDownloadOptions = {},
): UseFileDownloadResult {
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(loadMetadata && !!client && !!fileId);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<{ error: FileServiceError; source: ErrorSource } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const downloadingRef = useRef(false);
  const currentFileId = useRef(fileId);
  currentFileId.current = fileId;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setError(null);
    setFile(null);

    if (!client || !fileId || !loadMetadata) {
      setLoading(false);
      return;
    }

    let current = true;
    setLoading(true);

    client
      .getFile(fileId)
      .then((metadata) => {
        if (current) {
          setFile(metadata);
          const reason = getFileUnavailableReason(metadata);
          if (reason) {
            setError({ error: new FileServiceError(reason, getFileErrorMessage(reason)), source: 'metadata' });
          }
        }
      })
      .catch((err: unknown) => {
        if (current) {
          setError({ error: toFileServiceError(err), source: 'metadata' });
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
  }, [client, fileId, loadMetadata, reloadCount]);

  const download = useCallback(async () => {
    if (!client || !fileId || downloadingRef.current) {
      return;
    }

    downloadingRef.current = true;
    setDownloading(true);
    setError(null);

    try {
      const result = await client.downloadFile(fileId);
      saveFile(result.blob, result.filename);
    } catch (err) {
      // An error for a file the component no longer shows would be misleading.
      if (mounted.current && currentFileId.current === fileId) {
        setError({ error: toFileServiceError(err), source: 'download' });
      }
    } finally {
      downloadingRef.current = false;
      if (mounted.current) {
        setDownloading(false);
      }
    }
  }, [client, fileId]);

  const retry = useCallback(() => {
    if (error?.source === 'metadata') {
      setReloadCount((count) => count + 1);
    } else {
      void download();
    }
  }, [error, download]);

  const blockedByMetadata = loadMetadata && (loading || !file || error?.source === 'metadata');

  return {
    file,
    loading,
    downloading,
    ready: !!client && !!fileId && !blockedByMetadata,
    error: error?.error ?? null,
    download,
    retry,
  };
}
