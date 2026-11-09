import { act, renderHook, waitFor } from '@testing-library/react';
import {
  FileServiceError,
  type FileMetadata,
  type IFileUploadClient,
  type UploadFileOptions,
} from '@abgov/adsp-components-core';
import { useFileUpload } from './useFileUpload';

const fileTypeId = 'supporting-docs';
const fileType = { id: fileTypeId, name: 'Supporting documents', anonymousRead: false };
const file = new File(['%PDF-1.7'], 'Annual report.pdf', { type: 'application/pdf' });

const stored = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  id: 'file-1',
  urn: 'urn:ads:platform:file-service:v1:/files/file-1',
  filename: 'Annual report.pdf',
  size: 8,
  scanned: false,
  infected: false,
  ...overrides,
});

type MockClient = IFileUploadClient & Record<keyof IFileUploadClient, jest.Mock>;

const createClient = (overrides: Partial<IFileUploadClient> = {}): MockClient =>
  ({
    getFileType: jest.fn().mockResolvedValue(fileType),
    uploadFile: jest.fn().mockResolvedValue(stored()),
    ...overrides,
  }) as MockClient;

// An upload that the test finishes, so the in-progress state can be checked.
function deferredUpload() {
  let options: UploadFileOptions = {};
  let resolve: (file: FileMetadata) => void = () => undefined;
  let reject: (err: unknown) => void = () => undefined;
  const uploadFile = jest.fn((_type: string, _file: File, opts: UploadFileOptions = {}) => {
    options = opts;
    return new Promise<FileMetadata>((res, rej) => {
      resolve = res;
      reject = rej;
      opts.signal?.addEventListener('abort', () => rej(new DOMException('cancelled', 'AbortError')));
    });
  });
  return {
    uploadFile,
    progress: (fraction: number) => options.onProgress?.(fraction),
    resolve: (value: FileMetadata) => resolve(value),
    reject: (err: unknown) => reject(err),
  };
}

const renderReady = async (client: MockClient, options?: Parameters<typeof useFileUpload>[2]) => {
  const hook = renderHook(() => useFileUpload(client, fileTypeId, options));
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return hook;
};

describe('useFileUpload', () => {
  test('loads the File Type and is then ready to upload', async () => {
    // Arrange
    const client = createClient();

    // Act
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.fileType).toEqual(fileType);
    expect(client.getFileType).toHaveBeenCalledWith(fileTypeId);
  });

  test('requests nothing without a client', () => {
    // Arrange, Act
    const { result } = renderHook(() => useFileUpload(undefined, fileTypeId));

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.ready).toBe(false);
  });

  test('reports why the File Type could not be loaded', async () => {
    // Arrange
    const client = createClient({
      getFileType: jest.fn().mockRejectedValue(new FileServiceError('forbidden', 'no', 403)),
    });

    // Act
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));

    // Assert
    await waitFor(() => expect(result.current.error?.reason).toBe('forbidden'));
    expect(result.current.ready).toBe(false);
  });

  test('retry reloads the File Type after a failure', async () => {
    // Arrange
    const client = createClient({
      getFileType: jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(fileType),
    });
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));
    await waitFor(() => expect(result.current.error?.reason).toBe('unexpected'));

    // Act
    act(() => result.current.retry());

    // Assert
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(client.getFileType).toHaveBeenCalledTimes(2);
  });

  test('uploads the file with progress, then reports the stored file', async () => {
    // Arrange
    const deferred = deferredUpload();
    const onUpload = jest.fn();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client, { recordId: 'record-1', onUpload });

    // Act
    act(() => void result.current.upload(file));
    act(() => deferred.progress(0.4));

    // Assert
    expect(result.current.status).toBe('uploading');
    expect(result.current.selectedFile).toBe(file);
    expect(result.current.progress).toBe(0.4);
    expect(result.current.ready).toBe(false);
    expect(deferred.uploadFile).toHaveBeenCalledWith(
      fileTypeId,
      file,
      expect.objectContaining({ recordId: 'record-1', signal: expect.any(AbortSignal) }),
    );

    await act(async () => deferred.resolve(stored()));
    expect(result.current.status).toBe('uploaded');
    expect(result.current.uploaded).toEqual(stored());
    expect(result.current.ready).toBe(true);
    expect(onUpload).toHaveBeenCalledWith(stored());
  });

  test('ignores a second file while an upload is running', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client);
    act(() => void result.current.upload(file));

    // Act
    act(() => void result.current.upload(new File(['x'], 'other.txt')));

    // Assert
    expect(deferred.uploadFile).toHaveBeenCalledTimes(1);
    expect(result.current.selectedFile).toBe(file);
  });

  test('treats a File service rejection as the final answer', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn().mockRejectedValue(new FileServiceError('unavailable', 'Invalid filename', 400)),
    });
    const { result } = await renderReady(client);

    // Act
    await act(() => result.current.upload(file));

    // Assert
    expect(result.current.status).toBe('failed');
    expect(result.current.error?.reason).toBe('unavailable');
    expect(result.current.error?.retryable).toBe(false);
  });

  test('retry uploads the same file again after an unexpected failure', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(stored()),
    });
    const { result } = await renderReady(client);
    await act(() => result.current.upload(file));
    expect(result.current.error?.retryable).toBe(true);

    // Act
    act(() => result.current.retry());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('uploaded'));
    expect(client.uploadFile).toHaveBeenLastCalledWith(fileTypeId, file, expect.anything());
    expect(result.current.error).toBeNull();
  });

  test('reset cancels the upload in progress without reporting an error', async () => {
    // Arrange
    const deferred = deferredUpload();
    const onUpload = jest.fn();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client, { onUpload });
    act(() => void result.current.upload(file));

    // Act
    await act(async () => result.current.reset());

    // Assert
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);
    expect(onUpload).not.toHaveBeenCalled();
  });

  test('reset keeps a File Type error', async () => {
    // Arrange
    const client = createClient({
      getFileType: jest.fn().mockRejectedValue(new FileServiceError('not-found', 'no', 404)),
    });
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));
    await waitFor(() => expect(result.current.error).not.toBeNull());

    // Act
    act(() => result.current.reset());

    // Assert
    expect(result.current.error?.reason).toBe('not-found');
  });

  test('a new File Type cancels the upload to the old one and starts over', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result, rerender } = renderHook(({ type }) => useFileUpload(client, type), {
      initialProps: { type: fileTypeId },
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => void result.current.upload(file));
    const { signal } = deferred.uploadFile.mock.calls[0][2] as UploadFileOptions;

    // Act
    rerender({ type: 'images' });

    // Assert
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(client.getFileType).toHaveBeenLastCalledWith('images'));
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedFile).toBeNull();
  });

  test('unmounting cancels the upload in progress', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result, unmount } = await renderReady(client);
    act(() => void result.current.upload(file));
    const { signal } = deferred.uploadFile.mock.calls[0][2] as UploadFileOptions;

    // Act
    unmount();

    // Assert
    expect(signal?.aborted).toBe(true);
  });
});
