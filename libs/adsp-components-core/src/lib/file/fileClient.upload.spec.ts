import { FileClient } from './fileClient';
import { sendUpload } from './uploadRequest';

jest.mock('./uploadRequest', () => ({ sendUpload: jest.fn() }));
const sendUploadMock = sendUpload as jest.Mock;

const serviceUrl = 'https://file.test/';
const fileId = 'a217db73-0c29-4fbd-b576-49d049f855a6';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const mockFetch = (response: () => Response) => jest.fn(async () => response()) as unknown as jest.Mock & typeof fetch;

const xhr = {} as XMLHttpRequest;

const createClient = (
  fetchFn: typeof fetch = mockFetch(() => jsonResponse({})),
  getAccessToken?: () => Promise<string>,
) => new FileClient({ serviceUrl, fetch: fetchFn, getAccessToken, createXhr: () => xhr });

// The spec tsconfig has no DOM.Iterable lib, so read the keys through forEach.
const formKeys = (body: FormData) => {
  const keys: string[] = [];
  body.forEach((_value, key) => keys.push(key));
  return keys;
};

describe('FileClient uploads', () => {
  beforeEach(() => sendUploadMock.mockReset());

  describe('getFileType', () => {
    it('requests the File Type with the user token and maps it', async () => {
      const fetchFn = mockFetch(() =>
        jsonResponse({
          id: 'supporting-docs',
          name: 'Supporting documents',
          anonymousRead: true,
          readRoles: [],
          allowedFileTypes: [' .PDF ', ''],
        }),
      );

      const type = await createClient(fetchFn, async () => 'token-abc').getFileType('supporting docs');

      expect(type).toEqual({
        id: 'supporting-docs',
        name: 'Supporting documents',
        anonymousRead: true,
        allowedFileTypes: ['.PDF'],
      });
      expect(fetchFn).toHaveBeenCalledWith('https://file.test/file/v1/types/supporting%20docs', {
        headers: { Authorization: 'Bearer token-abc' },
      });
    });

    it('defaults anonymousRead to false', async () => {
      const fetchFn = mockFetch(() => jsonResponse({ id: 'docs', name: 'Docs' }));

      await expect(createClient(fetchFn).getFileType('docs')).resolves.toMatchObject({ anonymousRead: false });
    });

    it.each([
      [401, 'unauthenticated'],
      [403, 'forbidden'],
      [404, 'not-found'],
      [503, 'unexpected'],
    ])('rejects a %s response with reason %s', async (status, reason) => {
      const fetchFn = mockFetch(() => jsonResponse({ errorMessage: 'no' }, status));

      await expect(createClient(fetchFn).getFileType('docs')).rejects.toMatchObject({ reason, status });
    });
  });

  describe('uploadFile', () => {
    const serviceFile = {
      id: fileId,
      urn: `urn:ads:platform:file-service:v1:/files/${fileId}`,
      filename: 'Annual report.pdf',
      size: 8,
      typeName: 'Supporting documents',
      recordId: 'record-1',
      created: '2026-11-01T16:30:00.000Z',
    };

    it('sends the type and file details before the file, with the user token', async () => {
      sendUploadMock.mockResolvedValue(serviceFile);
      const file = new File(['%PDF-1.7'], 'Annual report.pdf', { type: 'application/pdf' });
      const onProgress = jest.fn();
      const signal = new AbortController().signal;

      await createClient(undefined, async () => 'token-abc').uploadFile('docs', file, {
        recordId: 'record-1',
        onProgress,
        signal,
      });

      const [{ body, ...rest }] = sendUploadMock.mock.calls[0];
      expect(rest).toEqual({ xhr, url: 'https://file.test/file/v1/files', token: 'token-abc', onProgress, signal });
      expect(formKeys(body)).toEqual(['type', 'filename', 'mimeType', 'recordId', 'file']);
      expect(body.get('type')).toBe('docs');
      expect(body.get('filename')).toBe('Annual report.pdf');
      expect(body.get('mimeType')).toBe('application/pdf');
      expect(body.get('recordId')).toBe('record-1');
    });

    it('leaves out the MIME type and record ID when there are none', async () => {
      sendUploadMock.mockResolvedValue(serviceFile);

      await createClient().uploadFile('docs', new File(['x'], 'notes'));

      expect(formKeys(sendUploadMock.mock.calls[0][0].body)).toEqual(['type', 'filename', 'file']);
    });

    it('returns the stored file as a domain model', async () => {
      sendUploadMock.mockResolvedValue(serviceFile);

      const uploaded = await createClient().uploadFile('docs', new File(['x'], 'Annual report.pdf'));

      expect(uploaded).toMatchObject({
        id: fileId,
        filename: 'Annual report.pdf',
        created: new Date('2026-11-01T16:30:00.000Z'),
        scanned: false,
        infected: false,
      });
    });

    it('passes on upload errors', async () => {
      const error = new Error('boom');
      sendUploadMock.mockRejectedValue(error);

      await expect(createClient().uploadFile('docs', new File(['x'], 'a.txt'))).rejects.toBe(error);
    });
  });
});
