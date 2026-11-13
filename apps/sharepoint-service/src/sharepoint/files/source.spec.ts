import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { FileServiceSource, LocalFileSource } from './source';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');

const readAll = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

describe('LocalFileSource', () => {
  let directory: string;
  let source: LocalFileSource;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sharepoint-source-'));
    await fs.writeFile(path.join(directory, 'proof.txt'), 'hello');
    await fs.mkdir(path.join(directory, 'folder'));
    source = new LocalFileSource(directory);
  });

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('opens a file by its name with its size', async () => {
    const content = await source.open(tenantId, 'local:proof.txt');

    expect(content.filename).toBe('proof.txt');
    expect(content.size).toBe(5);
    expect(await readAll(content.stream)).toBe('hello');
  });

  it.each(['proof.txt', '', 'file:proof.txt'])('rejects the reference "%s" without the local prefix', async (id) => {
    await expect(source.open(tenantId, id)).rejects.toMatchObject({ errorCode: 'file:invalid-reference' });
  });

  it.each(['local:../proof.txt', 'local:folder/proof.txt', 'local:folder/../../proof.txt', 'local:', 'local:..'])(
    'rejects the path "%s" outside the directory',
    async (id) => {
      await expect(source.open(tenantId, id)).rejects.toMatchObject({ errorCode: 'file:invalid-reference' });
    },
  );

  it('reports a missing file', async () => {
    await expect(source.open(tenantId, 'local:missing.txt')).rejects.toMatchObject({
      errorCode: 'file:not-found',
      retryable: false,
    });
  });

  it('reports a folder as not found', async () => {
    await expect(source.open(tenantId, 'local:folder')).rejects.toMatchObject({ errorCode: 'file:not-found' });
  });
});

describe('FileServiceSource', () => {
  const directory = { getResourceUrl: jest.fn(), getServiceUrl: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const source = new FileServiceSource(
    directory as unknown as ServiceDirectory,
    tokenProvider as unknown as TokenProvider,
  );
  const fileUrl = 'https://file.example/file/v1/files/abc-123';
  const urn = 'urn:ads:platform:file-service:v1:/files/abc-123';
  const auth = { Authorization: 'Bearer token-1' };
  const params = { tenantId: tenantId.toString() };

  beforeEach(() => {
    jest.resetAllMocks();
    directory.getResourceUrl.mockResolvedValue(new URL(fileUrl));
    tokenProvider.getAccessToken.mockResolvedValue('token-1');
    axiosMock.isAxiosError.mockReturnValue(true);
  });

  const mockFile = (stream = Readable.from(['data'])) => {
    axiosMock.get.mockResolvedValueOnce({ data: { filename: 'proof.pdf', size: 377797 } });
    axiosMock.get.mockResolvedValueOnce({ data: stream });
    return stream;
  };

  it('resolves a plain file ID through the directory and streams the download', async () => {
    const stream = mockFile();

    const content = await source.open(tenantId, 'abc-123');

    expect(directory.getResourceUrl.mock.calls[0][0].toString()).toBe(urn);
    expect(axiosMock.get).toHaveBeenNthCalledWith(1, fileUrl, { headers: auth, params });
    expect(axiosMock.get).toHaveBeenNthCalledWith(2, `${fileUrl}/download`, {
      headers: auth,
      params,
      responseType: 'stream',
    });
    expect(content).toEqual({ stream, size: 377797, filename: 'proof.pdf' });
  });

  it('accepts a file URN', async () => {
    mockFile();

    await source.open(tenantId, urn);

    expect(directory.getResourceUrl.mock.calls[0][0].toString()).toBe(urn);
  });

  it('handles a directory entry that already ends with download', async () => {
    directory.getResourceUrl.mockResolvedValue(new URL(`${fileUrl}/download`));
    mockFile();

    await source.open(tenantId, 'abc-123');

    expect(axiosMock.get.mock.calls[0][0]).toBe(fileUrl);
    expect(axiosMock.get.mock.calls[1][0]).toBe(`${fileUrl}/download`);
  });

  it.each([
    'urn:ads:platform:configuration-service:v2:/configuration/x',
    'urn:ads:platform:file-service:v1',
    'urn:ads:platform:file-service:v1:/types/abc',
    'urn:ads:platform:file-service:v1:/files/abc/download',
    'urn:ads:platform:file-service:v1:/files/abc/def',
    'urn:ads:platform:file-service:v1:/files/',
    'urn:ads:autotest:file-service:v1:/files/abc-123',
    'urn:ads:attacker:file-service:v1:/files/abc-123',
    'https://evil.example/file',
    'not a reference!',
    'a/b',
  ])('rejects the reference "%s" without any request', async (id) => {
    await expect(source.open(tenantId, id)).rejects.toMatchObject({
      errorCode: 'file:invalid-reference',
      retryable: false,
    });
    expect(directory.getResourceUrl).not.toHaveBeenCalled();
    expect(axiosMock.get).not.toHaveBeenCalled();
    expect(tokenProvider.getAccessToken).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'file:access-denied', false],
    [403, 'file:access-denied', false],
    [404, 'file:not-found', false],
    [400, 'file:not-ready', true],
    [500, 'file:unavailable', true],
    [418, 'file:unavailable', false],
  ])('maps a File Service %s response to %s', async (status, errorCode, retryable) => {
    axiosMock.get.mockRejectedValueOnce({ response: { status } });

    await expect(source.open(tenantId, 'abc-123')).rejects.toMatchObject({ errorCode, retryable });
  });

  it('maps a failed download after the metadata call', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { filename: 'proof.pdf', size: 10 } });
    axiosMock.get.mockRejectedValueOnce({ response: { status: 400 } });

    await expect(source.open(tenantId, 'abc-123')).rejects.toMatchObject({ errorCode: 'file:not-ready' });
  });

  it('treats a missing response as unavailable and retryable', async () => {
    axiosMock.get.mockRejectedValueOnce(new Error('socket hang up'));
    axiosMock.isAxiosError.mockReturnValue(false);

    await expect(source.open(tenantId, 'abc-123')).rejects.toMatchObject({
      errorCode: 'file:unavailable',
      retryable: true,
    });
  });

  it('reports a directory failure as unavailable', async () => {
    directory.getResourceUrl.mockRejectedValueOnce(new Error('directory down'));
    axiosMock.isAxiosError.mockReturnValue(false);

    await expect(source.open(tenantId, 'abc-123')).rejects.toMatchObject({ errorCode: 'file:unavailable' });
  });
});
