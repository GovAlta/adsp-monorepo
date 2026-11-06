import { FileClient } from './fileClient';
import { FileServiceError } from './fileServiceError';

const serviceUrl = 'https://file.test/';
const fileId = 'a217db73-0c29-4fbd-b576-49d049f855a6';

// Shaped like apps/file-service mapFile, including the fields the client doesn't use.
const serviceFile = {
  urn: `urn:ads:platform:file-service:v1:/files/${fileId}`,
  id: fileId,
  filename: 'Annual report.pdf',
  size: 1048576,
  typeName: 'Supporting documents',
  recordId: 'record-1',
  created: '2026-11-01T16:30:00.000Z',
  createdBy: { id: 'user-1', name: 'Tester' },
  lastAccessed: '2026-11-02T16:30:00.000Z',
  scanned: true,
  infected: false,
  mimeType: 'application/pdf',
  digest: 'abc',
  securityClassification: 'protected a',
  _links: { self: { href: 'self' }, download: { href: 'download' } },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fileResponse = (content: string, headers: Record<string, string>) =>
  new Response(content, { status: 200, headers });

function mockFetch(response: () => Response | Promise<Response>) {
  return jest.fn(async () => response()) as unknown as jest.Mock & typeof fetch;
}

const createClient = (fetchFn: typeof fetch, getAccessToken?: () => Promise<string | undefined>) =>
  new FileClient({ serviceUrl, fetch: fetchFn, getAccessToken });

describe('FileClient', () => {
  describe('getFile', () => {
    it('returns the file metadata as a domain model', async () => {
      const fetchFn = mockFetch(() => jsonResponse(serviceFile));

      const file = await createClient(fetchFn).getFile(fileId);

      expect(file).toEqual({
        id: fileId,
        urn: serviceFile.urn,
        filename: 'Annual report.pdf',
        size: 1048576,
        mimeType: 'application/pdf',
        typeName: 'Supporting documents',
        recordId: 'record-1',
        created: new Date('2026-11-01T16:30:00.000Z'),
        scanned: true,
        infected: false,
      });
    });

    it('requests the file from the v1 files endpoint', async () => {
      const fetchFn = mockFetch(() => jsonResponse(serviceFile));

      await createClient(fetchFn).getFile(fileId);

      expect(fetchFn).toHaveBeenCalledWith(`https://file.test/file/v1/files/${fileId}`, undefined);
    });

    it('sends the access token as a bearer token', async () => {
      const fetchFn = mockFetch(() => jsonResponse(serviceFile));

      await createClient(fetchFn, async () => 'user-token').getFile(fileId);

      expect(fetchFn).toHaveBeenCalledWith(expect.any(String), { headers: { Authorization: 'Bearer user-token' } });
    });

    it('sends no authorization header when there is no token', async () => {
      const fetchFn = mockFetch(() => jsonResponse(serviceFile));

      await createClient(fetchFn, async () => undefined).getFile(fileId);

      expect(fetchFn).toHaveBeenCalledWith(expect.any(String), undefined);
    });

    it('treats a file without scan fields as not scanned', async () => {
      const { scanned: _scanned, infected: _infected, ...unscanned } = serviceFile;
      const fetchFn = mockFetch(() => jsonResponse(unscanned));

      const file = await createClient(fetchFn).getFile(fileId);

      expect(file).toMatchObject({ scanned: false, infected: false });
    });

    it.each([
      [404, { errorMessage: `File with ID '${fileId}' not found.` }, 'not-found'],
      [403, { errorMessage: 'User Tester (ID: user-1) not permitted to read file.' }, 'forbidden'],
      [401, { errorMessage: 'User not authorized to access file.' }, 'unauthenticated'],
      [400, { errorMessage: 'Validation failed.' }, 'unavailable'],
    ])('throws a FileServiceError for a %s response', async (status, body, reason) => {
      const fetchFn = mockFetch(() => jsonResponse(body, status));

      const result = createClient(fetchFn).getFile(fileId);

      await expect(result).rejects.toBeInstanceOf(FileServiceError);
      await expect(result).rejects.toMatchObject({ reason, status });
    });

    it('includes the status code and service message in the error message', async () => {
      const fetchFn = mockFetch(() => jsonResponse({ errorMessage: 'File not found.' }, 404));

      await expect(createClient(fetchFn).getFile(fileId)).rejects.toThrow(
        'File request failed with status 404: File not found.',
      );
    });

    it('throws an unexpected error for a 500 response without a JSON body', async () => {
      const fetchFn = mockFetch(() => new Response('Internal Server Error', { status: 500 }));

      await expect(createClient(fetchFn).getFile(fileId)).rejects.toMatchObject({
        reason: 'unexpected',
        status: 500,
        message: 'File request failed with status 500.',
      });
    });
  });

  describe('downloadFile', () => {
    it('returns the file content with the filename and type File service sent', async () => {
      const fetchFn = mockFetch(() =>
        fileResponse('%PDF-1.7', {
          'Content-Type': 'application/pdf',
          'Content-Disposition': "attachment; filename*=UTF-8''Annual%20report.pdf",
        }),
      );

      const file = await createClient(fetchFn).downloadFile(fileId);

      expect(file.filename).toBe('Annual report.pdf');
      expect(file.mimeType).toBe('application/pdf');
      expect(await file.blob.text()).toBe('%PDF-1.7');
    });

    it('requests the download endpoint without unsafe=true', async () => {
      const fetchFn = mockFetch(() => fileResponse('content', { 'Content-Type': 'text/plain' }));

      await createClient(fetchFn).downloadFile(fileId);

      expect(fetchFn).toHaveBeenCalledWith(`https://file.test/file/v1/files/${fileId}/download`, undefined);
    });

    it('decodes non-ASCII filenames', async () => {
      const fetchFn = mockFetch(() =>
        fileResponse('content', {
          'Content-Type': 'text/plain',
          'Content-Disposition': "attachment; filename*=UTF-8''r%C3%A9sum%C3%A9%20%282026%29.txt",
        }),
      );

      const file = await createClient(fetchFn).downloadFile(fileId);

      expect(file.filename).toBe('résumé (2026).txt');
    });

    it('falls back to the file ID when there is no Content-Disposition header', async () => {
      const fetchFn = mockFetch(() => fileResponse('content', { 'Content-Type': 'text/plain' }));

      const file = await createClient(fetchFn).downloadFile(fileId);

      expect(file.filename).toBe(fileId);
    });

    it('throws scan-pending for the 400 File service sends before the virus scan completes', async () => {
      const fetchFn = mockFetch(() => jsonResponse({ errorMessage: 'File scan pending.' }, 400));

      await expect(createClient(fetchFn).downloadFile(fileId)).rejects.toMatchObject({
        reason: 'scan-pending',
        retryable: true,
      });
    });

    it('throws unavailable, not retryable, for an infected file', async () => {
      const fetchFn = mockFetch(() => jsonResponse({ errorMessage: 'Cannot access infected file.' }, 400));

      await expect(createClient(fetchFn).downloadFile(fileId)).rejects.toMatchObject({
        reason: 'unavailable',
        retryable: false,
      });
    });

    it('lets a network failure through for the caller to treat as unexpected', async () => {
      const fetchFn = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

      await expect(createClient(fetchFn).downloadFile(fileId)).rejects.toThrow('Failed to fetch');
    });
  });
});
