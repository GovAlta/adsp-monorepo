import { act, renderHook, waitFor } from '@testing-library/react';
import {
  FileServiceError,
  type FileMetadata,
  type IFileUploadClient,
  type UploadFileOptions,
} from '@abgov/adsp-components-core';
import { useFileUpload } from './useFileUpload';

const fileTypeId = 'supporting-docs';
const fileType = {
  id: fileTypeId,
  name: 'Supporting documents',
  anonymousRead: false,
  allowedFileTypes: [] as string[],
};
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
  const uploadFile = jest.fn((_type: string, _file: File, opts: UploadFileOptions = {}) => {
    options = opts;
    return new Promise<FileMetadata>((res, rej) => {
      resolve = res;
      opts.signal?.addEventListener('abort', () => rej(new DOMException('cancelled', 'AbortError')));
    });
  });
  return {
    uploadFile,
    progress: (fraction: number) => options.onProgress?.(fraction),
    resolve: (value: FileMetadata) => resolve(value),
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
    const { result } = await renderReady(client);

    // Assert
    expect(client.getFileType).toHaveBeenCalledWith(fileTypeId);
    expect(result.current.fileType).toEqual(fileType);
    expect(result.current.loading).toBe(false);
    expect(result.current.uploads).toEqual([]);
  });

  test('requests nothing without a client', () => {
    // Act
    const { result } = renderHook(() => useFileUpload(undefined, fileTypeId));

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.ready).toBe(false);
  });

  test('reports why the File Type could not be loaded, and reloads it', async () => {
    // Arrange
    const client = createClient({
      getFileType: jest
        .fn()
        .mockRejectedValueOnce(new FileServiceError('unexpected', 'down'))
        .mockResolvedValue(fileType),
    });
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));
    await waitFor(() => expect(result.current.typeError?.reason).toBe('unexpected'));

    // Act
    act(() => result.current.reloadType());

    // Assert
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.typeError).toBeNull();
    expect(client.getFileType).toHaveBeenCalledTimes(2);
  });

  test('uploads the file with progress, then reports the stored file', async () => {
    // Arrange
    const deferred = deferredUpload();
    const onUpload = jest.fn();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client, { recordId: 'record-1', onUpload });

    // Act
    act(() => result.current.upload(file));
    act(() => deferred.progress(0.5));

    // Assert
    expect(result.current.uploading).toBe(true);
    expect(result.current.uploads[0]).toMatchObject({ status: 'uploading', progress: 0.5 });
    expect(result.current.uploads[0].file).toBe(file);
    expect(deferred.uploadFile).toHaveBeenCalledWith(
      fileTypeId,
      file,
      expect.objectContaining({ recordId: 'record-1' }),
    );

    await act(async () => deferred.resolve(stored()));
    expect(result.current.uploads[0]).toMatchObject({ status: 'uploaded', progress: 1, uploaded: stored() });
    expect(result.current.uploading).toBe(false);
    expect(onUpload).toHaveBeenCalledWith(stored());
  });

  test('uploads several files at once and reports each one', async () => {
    // Arrange
    const second = new File(['x'], 'Budget.pdf', { type: 'application/pdf' });
    const onUpload = jest.fn();
    const client = createClient({
      uploadFile: jest.fn((_type: string, selected: File) => Promise.resolve(stored({ filename: selected.name }))),
    });
    const { result } = await renderReady(client, { onUpload });

    // Act
    await act(async () => result.current.upload([file, second]));

    // Assert
    await waitFor(() => expect(result.current.uploads.map((item) => item.status)).toEqual(['uploaded', 'uploaded']));
    expect(client.uploadFile).toHaveBeenCalledTimes(2);
    expect(onUpload).toHaveBeenCalledTimes(2);
    expect(new Set(result.current.uploads.map((item) => item.id)).size).toBe(2);
  });

  test('accepts another file while an upload is running', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client);

    // Act
    act(() => result.current.upload(file));
    act(() => result.current.upload(file));

    // Assert
    expect(deferred.uploadFile).toHaveBeenCalledTimes(2);
    expect(result.current.uploads).toHaveLength(2);
  });

  test('fails a file in a format the File Type does not allow without sending it', async () => {
    // Arrange
    const client = createClient({
      getFileType: jest.fn().mockResolvedValue({ ...fileType, allowedFileTypes: ['.PDF'] }),
    });
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    const { result } = await renderReady(client);

    // Act
    act(() => result.current.upload([video, file]));

    // Assert
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
    expect(client.uploadFile).toHaveBeenCalledWith(fileTypeId, file, expect.anything());
    const [rejected] = result.current.uploads;
    expect(rejected.file).toBe(video);
    expect(rejected.status).toBe('failed');
    expect(rejected.error?.reason).toBe('unsupported-format');
    expect(rejected.error?.retryable).toBe(false);
    await waitFor(() => expect(result.current.uploads[1].status).toBe('uploaded'));
  });

  test('treats a File service rejection as the final answer', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest
        .fn()
        .mockRejectedValue(new FileServiceError('unsupported-format', 'Invalid file type extension')),
    });
    const { result } = await renderReady(client);
    await act(async () => result.current.upload(file));
    await waitFor(() => expect(result.current.uploads[0].status).toBe('failed'));

    // Act
    act(() => result.current.retry(result.current.uploads[0].id));

    // Assert
    expect(client.uploadFile).toHaveBeenCalledTimes(1);
  });

  test('retry uploads the same file again after an unexpected failure', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(stored()),
    });
    const { result } = await renderReady(client);
    await act(async () => result.current.upload(file));
    await waitFor(() => expect(result.current.uploads[0].error?.retryable).toBe(true));

    // Act
    await act(async () => result.current.retry(result.current.uploads[0].id));

    // Assert
    await waitFor(() => expect(result.current.uploads[0].status).toBe('uploaded'));
    expect(client.uploadFile).toHaveBeenNthCalledWith(2, fileTypeId, file, expect.anything());
    expect(result.current.uploads).toHaveLength(1);
  });

  test('remove cancels the upload in progress and takes it off the list', async () => {
    // Arrange
    const deferred = deferredUpload();
    const onUpload = jest.fn();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result } = await renderReady(client, { onUpload });
    act(() => result.current.upload(file));

    // Act
    await act(async () => result.current.remove(result.current.uploads[0].id));

    // Assert
    expect(result.current.uploads).toEqual([]);
    expect(result.current.uploading).toBe(false);
    expect(onUpload).not.toHaveBeenCalled();
  });

  test('a new File Type cancels the uploads to the old one and starts over', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result, rerender } = renderHook(({ id }) => useFileUpload(client, id), {
      initialProps: { id: fileTypeId },
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.upload(file));
    const signal = deferred.uploadFile.mock.calls[0][2]?.signal as AbortSignal;

    // Act
    rerender({ id: 'other-docs' });

    // Assert
    expect(signal.aborted).toBe(true);
    expect(result.current.uploads).toEqual([]);
  });

  test('unmounting cancels the upload in progress', async () => {
    // Arrange
    const deferred = deferredUpload();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result, unmount } = await renderReady(client);
    act(() => result.current.upload(file));
    const signal = deferred.uploadFile.mock.calls[0][2]?.signal as AbortSignal;

    // Act
    unmount();

    // Assert
    expect(signal.aborted).toBe(true);
  });

  test('does not start an upload before the File Type has loaded', () => {
    // Arrange
    const client = createClient({ getFileType: jest.fn(() => new Promise(() => undefined)) });
    const { result } = renderHook(() => useFileUpload(client, fileTypeId));

    // Act
    act(() => result.current.upload(file));

    // Assert
    expect(client.uploadFile).not.toHaveBeenCalled();
    expect(result.current.uploads).toEqual([]);
  });

  test('a new recordId cancels the uploads for the old record and never reports them', async () => {
    // Arrange
    const deferred = deferredUpload();
    const onUpload = jest.fn();
    const client = createClient({ uploadFile: deferred.uploadFile });
    const { result, rerender } = renderHook(
      ({ recordId }) => useFileUpload(client, fileTypeId, { recordId, onUpload }),
      { initialProps: { recordId: 'record-1' } },
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.upload(file));

    // Act
    rerender({ recordId: 'record-2' });
    await act(async () => deferred.resolve(stored()));

    // Assert
    expect(result.current.uploads).toEqual([]);
    expect(onUpload).not.toHaveBeenCalled();
  });

  test('a throwing onUpload callback leaves the accepted upload as uploaded', async () => {
    // Arrange
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = createClient();
    const { result } = await renderReady(client, {
      onUpload: () => {
        throw new Error('app bug');
      },
    });

    // Act
    await act(async () => result.current.upload(file));

    // Assert
    await waitFor(() => expect(result.current.uploads[0].status).toBe('uploaded'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('tracks concurrent uploads independently', async () => {
    // Arrange
    const first = deferredUpload();
    const second = deferredUpload();
    const client = createClient({
      uploadFile: jest.fn().mockImplementationOnce(first.uploadFile).mockImplementationOnce(second.uploadFile),
    });
    const { result } = await renderReady(client);
    act(() => result.current.upload([file, file]));

    // Act
    act(() => first.progress(0.25));
    act(() => second.progress(0.75));
    await act(async () => result.current.remove(result.current.uploads[0].id));
    await act(async () => second.resolve(stored()));

    // Assert
    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0]).toMatchObject({ status: 'uploaded', progress: 1 });
  });
});
