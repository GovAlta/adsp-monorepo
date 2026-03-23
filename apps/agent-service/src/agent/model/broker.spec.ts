import { MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { AgentBroker } from './broker';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tarStream = require('tar-stream');

function createTestTar(files: { name: string; content: string }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tarStream.pack();
    const chunks: Buffer[] = [];
    pack.on('data', (chunk: Buffer) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);

    for (const file of files) {
      pack.entry({ name: file.name }, file.content);
    }
    pack.finalize();
  });
}

describe('AgentBroker', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const tenantId = {
    toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/test',
  };

  const user = {
    id: 'user-123',
    name: 'Test User',
  };

  it('adds workspace identity fields to request context', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const agent = {
      name: 'Test agent',
      generate,
      stream: jest.fn(),
    };
    const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

    await broker.generate(
      user as never,
      'thread-456',
      {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      },
    );

    const options = generate.mock.calls[0][1] as { requestContext: RequestContext<Record<string, unknown>> };

    expect(options.requestContext.get('tenantId')).toBe(tenantId);
    expect(options.requestContext.get('user')).toBe(user);
    expect(options.requestContext.get(MASTRA_THREAD_ID_KEY)).toBe('thread-456');
  });

  describe('initializeWorkspace', () => {
    it('throws if fileServiceClient is not configured', async () => {
      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn() };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      await expect(broker.initializeWorkspace(user as never, 'thread-1', 'urn:ads:platform:file-service:v1:/files/abc')).rejects.toThrow(
        'File service client is required'
      );
    });

    it('throws if workspace is not enabled', async () => {
      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn(), getWorkspace: jest.fn().mockResolvedValue(null) };
      const fileServiceClient = { getFileAndMetadata: jest.fn() };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {}, fileServiceClient as never);

      await expect(broker.initializeWorkspace(user as never, 'thread-1', 'urn:ads:platform:file-service:v1:/files/abc')).rejects.toThrow(
        'Workspace is not enabled'
      );
    });

    it('clears existing files and extracts tar into workspace', async () => {
      const tarball = await createTestTar([
        { name: 'hello.txt', content: 'Hello World' },
        { name: 'src/app.ts', content: 'export const x = 1;' },
      ]);

      const writeFile = jest.fn().mockResolvedValue(undefined);
      const deleteFile = jest.fn().mockResolvedValue(undefined);
      const mkdir = jest.fn().mockResolvedValue(undefined);
      const readdir = jest.fn().mockResolvedValue([{ name: 'old.txt', type: 'file' }]);
      const filesystem = { writeFile, deleteFile, mkdir, readdir };
      const workspace = { filesystem };

      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn(), getWorkspace: jest.fn().mockResolvedValue(workspace) };
      const fileServiceClient = {
        getFileAndMetadata: jest.fn().mockResolvedValue({ data: new Uint8Array(tarball), metadata: {} }),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {}, fileServiceClient as never);

      await broker.initializeWorkspace(user as never, 'thread-1', 'urn:ads:platform:file-service:v1:/files/abc');

      expect(deleteFile).toHaveBeenCalledWith('old.txt', { recursive: true, force: true });
      expect(writeFile).toHaveBeenCalledWith('hello.txt', expect.any(Buffer), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
    });
  });

  describe('updateWorkspace', () => {
    it('throws if workspace is not enabled', async () => {
      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn(), getWorkspace: jest.fn().mockResolvedValue(null) };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      await expect(broker.updateWorkspace(user as never, 'thread-1', [{ path: 'a.txt', content: 'x' }])).rejects.toThrow(
        'Workspace is not enabled'
      );
    });

    it('writes each file to workspace filesystem', async () => {
      const writeFile = jest.fn().mockResolvedValue(undefined);
      const filesystem = { writeFile };
      const workspace = { filesystem };
      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn(), getWorkspace: jest.fn().mockResolvedValue(workspace) };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      await broker.updateWorkspace(user as never, 'thread-1', [
        { path: 'a.txt', content: 'hello' },
        { path: 'b.txt', content: 'world' },
      ]);

      expect(writeFile).toHaveBeenCalledWith('a.txt', 'hello', { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('b.txt', 'world', { recursive: true });
    });
  });
});