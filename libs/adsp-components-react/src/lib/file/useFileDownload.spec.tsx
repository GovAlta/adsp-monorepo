import { act, renderHook, waitFor } from '@testing-library/react';
import { FileServiceError, type FileMetadata, type IFileClient } from '@abgov/adsp-components-core';
import { useFileDownload } from './useFileDownload';
import { saveFile } from './saveFile';

jest.mock('./saveFile', () => ({ saveFile: jest.fn() }));
const saveFileMock = saveFile as jest.Mock;

const fileId = 'a217db73-0c29-4fbd-b576-49d049f855a6';

const metadata = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  id: fileId,
  urn: `urn:ads:platform:file-service:v1:/files/${fileId}`,
  filename: 'Annual report.pdf',
  size: 1048576,
  mimeType: 'application/pdf',
  scanned: true,
  infected: false,
  ...overrides,
});

const downloaded = () => ({ blob: new Blob(['%PDF-1.7']), filename: 'Annual report.pdf', mimeType: 'application/pdf' });

const createClient = (overrides: Partial<IFileClient> = {}): IFileClient & Record<keyof IFileClient, jest.Mock> =>
  ({
    getFile: jest.fn().mockResolvedValue(metadata()),
    downloadFile: jest.fn().mockResolvedValue(downloaded()),
    ...overrides,
  }) as IFileClient & Record<keyof IFileClient, jest.Mock>;

describe('useFileDownload', () => {
  beforeEach(() => {
    saveFileMock.mockReset();
  });

  test('loads the file metadata and is then ready to download', async () => {
    // Arrange
    const client = createClient();

    // Act
    const { result } = renderHook(() => useFileDownload(client, fileId));

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.file).toEqual(metadata());
    expect(result.current.ready).toBe(true);
    expect(client.getFile).toHaveBeenCalledWith(fileId);
  });

  test('does not load metadata when loadMetadata is false, and is ready at once', () => {
    // Arrange
    const client = createClient();

    // Act
    const { result } = renderHook(() => useFileDownload(client, fileId, { loadMetadata: false }));

    // Assert
    expect(client.getFile).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ file: null, loading: false, ready: true });
  });

  test('requests nothing and is not ready without a client', async () => {
    // Arrange, Act
    const { result } = renderHook(() => useFileDownload(undefined, fileId));

    // Assert
    expect(result.current).toMatchObject({ loading: false, ready: false });
    await act(() => result.current.download());
    expect(saveFileMock).not.toHaveBeenCalled();
  });

  test('downloads the file and saves it with the filename File service gave it', async () => {
    // Arrange
    const client = createClient();
    const { result } = renderHook(() => useFileDownload(client, fileId));
    await waitFor(() => expect(result.current.ready).toBe(true));

    // Act
    await act(() => result.current.download());

    // Assert
    expect(client.downloadFile).toHaveBeenCalledWith(fileId);
    expect(saveFileMock).toHaveBeenCalledWith(expect.any(Blob), 'Annual report.pdf');
    expect(result.current.downloading).toBe(false);
  });

  test('reports downloading while the download runs and ignores a second call', async () => {
    // Arrange
    let finish: (value: ReturnType<typeof downloaded>) => void = () => undefined;
    const client = createClient({ downloadFile: jest.fn(() => new Promise((resolve) => (finish = resolve))) });
    const { result } = renderHook(() => useFileDownload(client, fileId, { loadMetadata: false }));

    // Act
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.download();
    });
    await act(() => result.current.download());

    // Assert
    expect(result.current.downloading).toBe(true);
    expect(client.downloadFile).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish(downloaded());
      await first;
    });
    expect(result.current.downloading).toBe(false);
  });

  test.each([
    ['not-found', 404],
    ['forbidden', 403],
  ] as const)('reports a %s metadata error as not retryable and not ready', async (reason, status) => {
    // Arrange
    const client = createClient({
      getFile: jest.fn().mockRejectedValue(new FileServiceError(reason, 'failed', status)),
    });

    // Act
    const { result } = renderHook(() => useFileDownload(client, fileId));

    // Assert
    await waitFor(() => expect(result.current.error?.reason).toBe(reason));
    expect(result.current.error?.retryable).toBe(false);
    expect(result.current.ready).toBe(false);
  });

  test('reports a file whose scan is pending from its metadata, before any download', async () => {
    // Arrange
    const client = createClient({ getFile: jest.fn().mockResolvedValue(metadata({ scanned: false })) });

    // Act
    const { result } = renderHook(() => useFileDownload(client, fileId));

    // Assert
    await waitFor(() => expect(result.current.error?.reason).toBe('scan-pending'));
    expect(result.current.file).toEqual(metadata({ scanned: false }));
    expect(result.current.ready).toBe(false);
  });

  test('retry reloads the metadata after a metadata error', async () => {
    // Arrange
    const client = createClient({
      getFile: jest
        .fn()
        .mockResolvedValueOnce(metadata({ scanned: false }))
        .mockResolvedValueOnce(metadata()),
    });
    const { result } = renderHook(() => useFileDownload(client, fileId));
    await waitFor(() => expect(result.current.error?.reason).toBe('scan-pending'));

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.error).toBeNull();
    expect(client.getFile).toHaveBeenCalledTimes(2);
    expect(client.downloadFile).not.toHaveBeenCalled();
  });

  test('treats a network failure during download as unexpected and retryable', async () => {
    // Arrange
    const client = createClient({ downloadFile: jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) });
    const { result } = renderHook(() => useFileDownload(client, fileId));
    await waitFor(() => expect(result.current.ready).toBe(true));

    // Act
    await act(() => result.current.download());

    // Assert
    expect(result.current.error).toMatchObject({ reason: 'unexpected', retryable: true });
    expect(result.current.ready).toBe(true);
    expect(saveFileMock).not.toHaveBeenCalled();
  });

  test('retry downloads again after a download error', async () => {
    // Arrange
    const client = createClient({
      downloadFile: jest
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(downloaded()),
    });
    const { result } = renderHook(() => useFileDownload(client, fileId, { loadMetadata: false }));
    await act(() => result.current.download());

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(saveFileMock).toHaveBeenCalledTimes(1));
    expect(result.current.error).toBeNull();
    expect(client.downloadFile).toHaveBeenCalledTimes(2);
  });

  test('clears the error and loads the new file when the file ID changes', async () => {
    // Arrange
    const otherId = 'b317db73-0c29-4fbd-b576-49d049f855a7';
    const client = createClient({
      getFile: jest.fn((id: string) =>
        id === fileId
          ? Promise.reject(new FileServiceError('not-found', 'failed', 404))
          : Promise.resolve(metadata({ id: otherId, filename: 'Other.pdf' })),
      ),
    });
    const { result, rerender } = renderHook(({ id }) => useFileDownload(client, id), { initialProps: { id: fileId } });
    await waitFor(() => expect(result.current.error?.reason).toBe('not-found'));

    // Act
    rerender({ id: otherId });

    // Assert
    await waitFor(() => expect(result.current.file?.filename).toBe('Other.pdf'));
    expect(result.current.error).toBeNull();
  });

  test('ignores a metadata response for a file ID that is no longer current', async () => {
    // Arrange
    const otherId = 'b317db73-0c29-4fbd-b576-49d049f855a7';
    let resolveFirst: (value: FileMetadata) => void = () => undefined;
    const client = createClient({
      getFile: jest.fn((id: string) =>
        id === fileId
          ? new Promise<FileMetadata>((resolve) => (resolveFirst = resolve))
          : Promise.resolve(metadata({ id: otherId, filename: 'Other.pdf' })),
      ),
    });
    const { result, rerender } = renderHook(({ id }) => useFileDownload(client, id), { initialProps: { id: fileId } });
    rerender({ id: otherId });
    await waitFor(() => expect(result.current.file?.filename).toBe('Other.pdf'));

    // Act
    await act(async () => resolveFirst(metadata()));

    // Assert
    expect(result.current.file?.filename).toBe('Other.pdf');
  });
});
