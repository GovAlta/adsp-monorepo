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

interface DownloadTarget {
  client: IFileClient;
  fileId: string;
}

const isTarget = (target: DownloadTarget | null, client: IFileClient | undefined, fileId: string) =>
  !!target && target.client === client && target.fileId === fileId;

// The client must be stable across renders (create it once or memoize it). Nothing is requested without a client.
export function useFileDownload(
  client: IFileClient | undefined,
  fileId: string,
  { loadMetadata = true }: UseFileDownloadOptions = {},
): UseFileDownloadResult {
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(loadMetadata && !!client && !!fileId);
  // The download in progress, so its state belongs to that file only and not to whichever file is shown next.
  const [downloadingTarget, setDownloadingTarget] = useState<DownloadTarget | null>(null);
  const [error, setError] = useState<{ error: FileServiceError; source: ErrorSource } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const activeDownload = useRef<DownloadTarget | null>(null);
  const current = useRef({ client, fileId });
  current.current = { client, fileId };
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
    if (!client || !fileId || isTarget(activeDownload.current, client, fileId)) {
      return;
    }

    const target: DownloadTarget = { client, fileId };
    activeDownload.current = target;
    setDownloadingTarget(target);
    setError(null);

    try {
      const result = await client.downloadFile(fileId);
      // The user asked for this file, so it is saved even if the component has moved on to another one.
      saveFile(result.blob, result.filename);
    } catch (err) {
      // An error for a file the component no longer shows would be misleading.
      if (mounted.current && isTarget(target, current.current.client, current.current.fileId)) {
        setError({ error: toFileServiceError(err), source: 'download' });
      }
    } finally {
      if (activeDownload.current === target) {
        activeDownload.current = null;
      }
      if (mounted.current) {
        setDownloadingTarget((active) => (active === target ? null : active));
      }
    }
  }, [client, fileId]);

  const retry = useCallback(() => {
    if (error?.source === 'metadata') {
      // Set now rather than in the effect, so the render after the click already shows the reload.
      setError(null);
      setLoading(true);
      setReloadCount((count) => count + 1);
    } else {
      void download();
    }
  }, [error, download]);

  const blockedByMetadata = loadMetadata && (loading || !file || error?.source === 'metadata');

  return {
    file,
    loading,
    downloading: isTarget(downloadingTarget, client, fileId),
    ready: !!client && !!fileId && !blockedByMetadata,
    error: error?.error ?? null,
    download,
    retry,
  };
}
