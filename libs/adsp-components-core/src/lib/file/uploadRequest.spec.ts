import { sendUpload } from './uploadRequest';
import { FileServiceError } from './fileServiceError';

// Just enough of XMLHttpRequest for sendUpload; tests drive it by calling the handlers it installs.
class FakeXhr {
  status = 0;
  responseText = '';
  upload: { onprogress: ((event: Partial<ProgressEvent>) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open = jest.fn();
  setRequestHeader = jest.fn();
  send = jest.fn();
  abort = jest.fn(() => this.onabort?.());

  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
    this.onload?.();
  }
}

const request = (xhr: FakeXhr, overrides: Partial<Parameters<typeof sendUpload>[0]> = {}) =>
  sendUpload({
    xhr: xhr as unknown as XMLHttpRequest,
    url: 'https://file.test/file/v1/files',
    body: new FormData(),
    ...overrides,
  });

describe('sendUpload', () => {
  it('posts the form with the bearer token and resolves with the JSON response', async () => {
    const xhr = new FakeXhr();
    const body = new FormData();

    const result = request(xhr, { token: 'token-abc', body });
    xhr.respond(200, { id: 'file-1' });

    await expect(result).resolves.toEqual({ id: 'file-1' });
    expect(xhr.open).toHaveBeenCalledWith('POST', 'https://file.test/file/v1/files');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token-abc');
    expect(xhr.send).toHaveBeenCalledWith(body);
  });

  it('sends no Authorization header without a token', async () => {
    const xhr = new FakeXhr();

    const result = request(xhr);
    xhr.respond(200, {});

    await result;
    expect(xhr.setRequestHeader).not.toHaveBeenCalled();
  });

  it('reports progress as a fraction of the content sent', async () => {
    const xhr = new FakeXhr();
    const onProgress = jest.fn();

    const result = request(xhr, { onProgress });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 50, total: 0 });
    xhr.respond(200, {});

    await result;
    expect(onProgress.mock.calls).toEqual([[0.25]]);
  });

  it.each([
    [403, { errorMessage: 'User not permitted.' }, 'forbidden'],
    [404, { errorMessage: 'File Type not found.' }, 'not-found'],
    [400, { errorMessage: 'Specified filename is not valid.' }, 'unavailable'],
    [500, 'Internal Server Error', 'unexpected'],
  ])('rejects a %s response as a FileServiceError', async (status, body, reason) => {
    const xhr = new FakeXhr();

    const result = request(xhr);
    xhr.respond(status, body);

    await expect(result).rejects.toMatchObject({ name: 'FileServiceError', reason, status });
  });

  it("includes File service's error message in the error", async () => {
    const xhr = new FakeXhr();

    const result = request(xhr);
    xhr.respond(400, { errorMessage: 'Type of file not specified.' });

    await expect(result).rejects.toThrow('File upload failed with status 400: Type of file not specified.');
  });

  it('rejects a success response that is not JSON as unexpected', async () => {
    const xhr = new FakeXhr();

    const result = request(xhr);
    xhr.respond(200, 'not json');

    const error: unknown = await result.catch((err) => err);
    expect(error).toBeInstanceOf(FileServiceError);
    expect((error as FileServiceError).reason).toBe('unexpected');
  });

  it('rejects with a TypeError on a network failure', async () => {
    const xhr = new FakeXhr();

    const result = request(xhr);
    xhr.onerror?.();

    await expect(result).rejects.toThrow(TypeError);
  });

  it('aborts the request when the signal is aborted', async () => {
    const xhr = new FakeXhr();
    const controller = new AbortController();

    const result = request(xhr, { signal: controller.signal });
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(xhr.abort).toHaveBeenCalled();
  });

  it('sends nothing when the signal is already aborted', async () => {
    const xhr = new FakeXhr();
    const controller = new AbortController();
    controller.abort();

    await expect(request(xhr, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(xhr.send).not.toHaveBeenCalled();
  });
});
