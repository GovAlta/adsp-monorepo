import axios from 'axios';
import { Readable } from 'stream';
import { GraphFileClient, SIMPLE_UPLOAD_LIMIT } from './files';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('GraphFileClient', () => {
  const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
  const itemPath = `https://graph.example/v1.0/sites/${siteId}/drive/root:/sub-1/proof.pdf:`;
  const uploadUrl = 'https://upload.example/session-1';
  const driveItem = { id: 'item-1', name: 'proof.pdf', webUrl: 'https://sp.example/sub-1/proof.pdf', size: 10 };
  const client = new GraphFileClient('https://graph.example/v1.0/', 5 * 1024 * 1024);

  const streamOf = (size: number) => Readable.from([Buffer.alloc(size, 7)]);
  const headersOf = (call: unknown[]) => (call[2] as { headers: Record<string, unknown> }).headers;

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
    axiosMock.delete.mockReset();
    axiosMock.isAxiosError.mockReset();
    axiosMock.delete.mockResolvedValue({});
  });

  describe('files up to 4 MB', () => {
    it('uploads a 1 MB file with a single PUT by path and returns the SharePoint file', async () => {
      axiosMock.put.mockResolvedValueOnce({ status: 201, data: { ...driveItem, extra: 'ignored' } });
      const stream = streamOf(1024 * 1024);

      const result = await client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', 1024 * 1024, stream);

      expect(result).toEqual(driveItem);
      expect(axiosMock.put).toHaveBeenCalledTimes(1);
      expect(axiosMock.put).toHaveBeenCalledWith(`${itemPath}/content`, stream, {
        headers: {
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/octet-stream',
          'Content-Length': 1024 * 1024,
        },
        maxBodyLength: Infinity,
      });
      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('uses the single PUT for a file of exactly 4 MB', async () => {
      axiosMock.put.mockResolvedValueOnce({ status: 200, data: driveItem });

      await client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', SIMPLE_UPLOAD_LIMIT, streamOf(1));

      expect(axiosMock.put).toHaveBeenCalledTimes(1);
      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('encodes the folder and file name in the path', async () => {
      axiosMock.put.mockResolvedValueOnce({ status: 200, data: driveItem });

      await client.uploadFile('token-1', siteId, 'sub #1', 'my file&name.pdf', 10, streamOf(10));

      expect(axiosMock.put).toHaveBeenCalledWith(
        `https://graph.example/v1.0/sites/${siteId}/drive/root:/sub%20%231/my%20file%26name.pdf:/content`,
        expect.anything(),
        expect.anything(),
      );
    });

    it('maps a Graph error to its code and closes the stream', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.put.mockRejectedValueOnce({
        response: { status: 403, data: { error: { code: 'accessDenied', message: 'Access denied' } } },
      });
      const stream = streamOf(10);

      await expect(client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', 10, stream)).rejects.toMatchObject({
        errorCode: 'graph:accessDenied',
        retryable: false,
      });
      expect(stream.destroyed).toBe(true);
    });
  });

  describe('files over 4 MB', () => {
    const mebibyte = 1024 * 1024;

    it('creates an upload session for a file of 4 MB plus one byte', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put.mockResolvedValueOnce({ status: 201, data: driveItem });

      const result = await client.uploadFile(
        'token-1',
        siteId,
        'sub-1',
        'proof.pdf',
        SIMPLE_UPLOAD_LIMIT + 1,
        streamOf(SIMPLE_UPLOAD_LIMIT + 1),
      );

      expect(result).toEqual(driveItem);
      expect(axiosMock.post).toHaveBeenCalledWith(
        `${itemPath}/createUploadSession`,
        { item: { '@microsoft.graph.conflictBehavior': 'replace' } },
        { headers: { Authorization: 'Bearer token-1' } },
      );
      expect(axiosMock.put).toHaveBeenCalledTimes(1);
      expect(axiosMock.put.mock.calls[0][0]).toBe(uploadUrl);
    });

    it('uploads a 12 MB file as sequential chunks with matching ranges and no authorization header', async () => {
      const size = 12 * mebibyte;
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put
        .mockResolvedValueOnce({ status: 202, data: {} })
        .mockResolvedValueOnce({ status: 202, data: {} })
        .mockResolvedValueOnce({ status: 201, data: driveItem });

      const result = await client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', size, streamOf(size));

      expect(result).toEqual(driveItem);
      const ranges = axiosMock.put.mock.calls.map((call) => headersOf(call)['Content-Range']);
      expect(ranges).toEqual([
        `bytes 0-${5 * mebibyte - 1}/${size}`,
        `bytes ${5 * mebibyte}-${10 * mebibyte - 1}/${size}`,
        `bytes ${10 * mebibyte}-${size - 1}/${size}`,
      ]);
      const lengths = axiosMock.put.mock.calls.map((call) => headersOf(call)['Content-Length']);
      expect(lengths).toEqual([5 * mebibyte, 5 * mebibyte, 2 * mebibyte]);
      axiosMock.put.mock.calls.forEach((call) => {
        expect(call[0]).toBe(uploadUrl);
        expect(headersOf(call).Authorization).toBeUndefined();
      });
      expect(axiosMock.delete).not.toHaveBeenCalled();
    });

    it('rounds the chunk size down to a multiple of 320 KiB', async () => {
      const oddClient = new GraphFileClient('https://graph.example/v1.0', 1000 * 1024);
      const size = 5 * mebibyte;
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put.mockResolvedValue({ status: 202, data: {} });

      await oddClient.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', size, streamOf(size)).catch(() => undefined);

      const first = headersOf(axiosMock.put.mock.calls[0])['Content-Length'] as number;
      expect(first).toBe(960 * 1024);
      expect(first % (320 * 1024)).toBe(0);
    });

    it('cancels the session and reports the Graph code when a chunk fails part way', async () => {
      const size = 12 * mebibyte;
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put.mockResolvedValueOnce({ status: 202, data: {} }).mockRejectedValueOnce({
        response: { status: 503, data: { error: { code: 'serviceNotAvailable', message: 'Try later' } } },
      });
      const stream = streamOf(size);

      await expect(client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', size, stream)).rejects.toMatchObject({
        errorCode: 'graph:serviceNotAvailable',
        retryable: true,
      });
      expect(axiosMock.put).toHaveBeenCalledTimes(2);
      expect(axiosMock.delete).toHaveBeenCalledWith(uploadUrl);
      expect(stream.destroyed).toBe(true);
    });

    it('fails and cancels the session when the stream is shorter than the declared size', async () => {
      const size = 12 * mebibyte;
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put.mockResolvedValue({ status: 202, data: {} });

      await expect(
        client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', size, streamOf(6 * mebibyte)),
      ).rejects.toMatchObject({ errorCode: 'file:size-mismatch', retryable: false });
      expect(axiosMock.delete).toHaveBeenCalledWith(uploadUrl);
    });

    it('still reports the original error when cancelling the session fails', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.post.mockResolvedValueOnce({ data: { uploadUrl } });
      axiosMock.put.mockRejectedValueOnce({ response: { status: 500, data: { error: { code: 'generalException' } } } });
      axiosMock.delete.mockRejectedValueOnce(new Error('gone'));

      await expect(
        client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', 6 * mebibyte, streamOf(6 * mebibyte)),
      ).rejects.toMatchObject({ errorCode: 'graph:generalException' });
    });

    it('does not start chunking when creating the session fails', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.post.mockRejectedValueOnce({
        response: { status: 403, data: { error: { code: 'accessDenied', message: 'No' } } },
      });

      await expect(
        client.uploadFile('token-1', siteId, 'sub-1', 'proof.pdf', 6 * mebibyte, streamOf(6 * mebibyte)),
      ).rejects.toMatchObject({ errorCode: 'graph:accessDenied' });
      expect(axiosMock.put).not.toHaveBeenCalled();
      expect(axiosMock.delete).not.toHaveBeenCalled();
    });
  });
});
