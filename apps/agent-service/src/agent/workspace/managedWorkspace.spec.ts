import * as tarStream from 'tar-stream';
import { gzipSync } from 'node:zlib';
import { ManagedWorkspace, WorkspaceChangeProjector } from './managedWorkspace';

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

function createTestTarWithRootDirectory(files: { name: string; content: string }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tarStream.pack();
    const chunks: Buffer[] = [];
    pack.on('data', (chunk: Buffer) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);

    pack.entry({ name: './', type: 'directory' });
    for (const file of files) {
      pack.entry({ name: `./${file.name}` }, file.content);
    }
    pack.finalize();
  });
}

function createTestTarWithMacMetadata(files: { name: string; content: string }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tarStream.pack();
    const chunks: Buffer[] = [];
    pack.on('data', (chunk: Buffer) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);

    pack.entry({ name: '__MACOSX/', type: 'directory' });
    pack.entry({ name: '__MACOSX/._App.tsx' }, 'metadata');
    pack.entry({ name: 'src/._App.tsx' }, 'metadata');
    pack.entry({ name: '.DS_Store' }, 'metadata');
    for (const file of files) {
      pack.entry({ name: file.name }, file.content);
    }
    pack.finalize();
  });
}

describe('ManagedWorkspace', () => {
  it('rejects reserved metadata paths', () => {
    expect(() => ManagedWorkspace.validatePath('.agent/revision.json')).toThrow(
      'Reserved workspace metadata paths cannot be modified.',
    );
  });

  describe('WorkspaceChangeProjector', () => {
    it('projects write_file tool-call/result pair into a workspace-change event with content', async () => {
      const projector = new WorkspaceChangeProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-1',
        args: { path: 'src/App.tsx', content: 'export default () => null;' },
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-1',
        result: 'Wrote 26 bytes to src/App.tsx',
      });

      expect(event).toEqual({
        toolName: 'mastra_workspace_write_file',
        writes: [{ path: 'src/App.tsx', content: 'export default () => null;' }],
        deletes: [],
        writeCount: 1,
        deleteCount: 0,
      });
    });

    it('projects edit_file and backfills content from the workspace', async () => {
      const readFile = jest.fn().mockResolvedValue('export const x = 2;');
      const workspace = new ManagedWorkspace({ readFile } as never);
      const projector = workspace.createProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-2',
        args: { path: 'src/App.tsx', old_string: 'x = 1', new_string: 'x = 2' },
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-2',
        result: 'Replaced 1 occurrence in src/App.tsx',
      });

      expect(readFile).toHaveBeenCalledWith('src/App.tsx');
      expect(event).toEqual({
        toolName: 'mastra_workspace_edit_file',
        writes: [{ path: 'src/App.tsx', content: 'export const x = 2;' }],
        deletes: [],
        writeCount: 1,
        deleteCount: 0,
      });
    });

    it('projects edit_file without content when workspace is not bound', async () => {
      const projector = new WorkspaceChangeProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-2b',
        args: { path: 'src/App.tsx', old_string: 'foo', new_string: 'bar' },
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-2b',
        result: 'Replaced 1 occurrence in src/App.tsx',
      });

      expect(event).toEqual({
        toolName: 'mastra_workspace_edit_file',
        writes: [{ path: 'src/App.tsx' }],
        deletes: [],
        writeCount: 1,
        deleteCount: 0,
      });
    });

    it('projects delete tool-call/result pair into a workspace-change event', async () => {
      const projector = new WorkspaceChangeProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_delete',
        toolCallId: 'call-3',
        args: { path: 'src/old.ts' },
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_delete',
        toolCallId: 'call-3',
        result: 'Deleted src/old.ts',
      });

      expect(event).toEqual({
        toolName: 'mastra_workspace_delete',
        writes: [],
        deletes: ['src/old.ts'],
        writeCount: 0,
        deleteCount: 1,
      });
    });

    it('returns undefined for unrelated tool results', async () => {
      const projector = new WorkspaceChangeProjector();

      // No matching tool-call was recorded
      const event = await projector.onToolResult({
        toolName: 'formDataUpdateTool',
        toolCallId: 'call-4',
        result: { id: 'form-1' },
      });

      expect(event).toBeUndefined();
    });

    it('returns undefined for tool-result with no preceding tool-call', async () => {
      const projector = new WorkspaceChangeProjector();

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-orphan',
        result: 'Wrote 0 bytes',
      });

      expect(event).toBeUndefined();
    });

    it('clears pending tool calls when a tool-error is received', async () => {
      const projector = new WorkspaceChangeProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-error',
        args: { path: 'src/App.tsx', content: 'export default () => null;' },
      });

      projector.onToolError({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-error',
        error: 'write failed',
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-error',
        result: 'Wrote 26 bytes to src/App.tsx',
      });

      expect(event).toBeUndefined();
    });

    it('rejects reserved metadata path in tool args', async () => {
      const projector = new WorkspaceChangeProjector();

      projector.onToolCall({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-bad',
        args: { path: '.agent/revision.json', content: '{}' },
      });

      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-bad',
        result: 'Wrote 2 bytes',
      });

      expect(event).toBeUndefined();
    });
  });

  it('clears all files and directories from the workspace root', async () => {
    const readdir = jest.fn().mockResolvedValue([
      { name: 'src', type: 'directory' },
      { name: 'README.md', type: 'file' },
    ]);
    const rmdir = jest.fn().mockResolvedValue(undefined);
    const deleteFile = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readdir, rmdir, deleteFile } as never);

    await workspace.clear();

    expect(rmdir).toHaveBeenCalledWith('src', { recursive: true, force: true });
    expect(deleteFile).toHaveBeenCalledWith('README.md', { recursive: true, force: true });
  });

  it('initializes from a tarball and writes revision metadata', async () => {
    const tarball = await createTestTar([
      { name: 'package.json', content: '{"name":"demo"}' },
      { name: 'src/app.ts', content: 'export const app = true;' },
    ]);

    const readdir = jest.fn().mockResolvedValue([]);
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readdir, mkdir, writeFile } as never);

    const revision = await workspace.initializeFromTarball(tarball);

    expect(writeFile).toHaveBeenCalledWith('package.json', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
    expect(revision.revision).toBe(1);
  });

  it('initializes from a gzipped tarball', async () => {
    const tarball = await createTestTar([
      { name: 'package.json', content: '{"name":"demo"}' },
      { name: 'src/app.ts', content: 'export const app = true;' },
    ]);
    const gzippedTarball = gzipSync(tarball);

    const readdir = jest.fn().mockResolvedValue([]);
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readdir, mkdir, writeFile } as never);

    const revision = await workspace.initializeFromTarball(gzippedTarball);

    expect(writeFile).toHaveBeenCalledWith('package.json', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
    expect(revision.revision).toBe(1);
  });

  it('initializes when tar contains a root marker entry', async () => {
    const tarball = await createTestTarWithRootDirectory([
      { name: 'package.json', content: '{"name":"demo"}' },
      { name: 'src/app.ts', content: 'export const app = true;' },
    ]);

    const readdir = jest.fn().mockResolvedValue([]);
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readdir, mkdir, writeFile } as never);

    const revision = await workspace.initializeFromTarball(tarball);

    expect(writeFile).toHaveBeenCalledWith('package.json', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
    expect(revision.revision).toBe(1);
  });

  it('ignores macOS metadata entries in tar archives', async () => {
    const tarball = await createTestTarWithMacMetadata([
      { name: 'package.json', content: '{"name":"demo"}' },
      { name: 'src/app.ts', content: 'export const app = true;' },
    ]);

    const readdir = jest.fn().mockResolvedValue([]);
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readdir, mkdir, writeFile } as never);

    const revision = await workspace.initializeFromTarball(tarball);

    expect(writeFile).toHaveBeenCalledWith('package.json', expect.any(Buffer), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
    expect(writeFile).not.toHaveBeenCalledWith(
      expect.stringMatching(/^__MACOSX\//),
      expect.anything(),
      expect.anything(),
    );
    expect(writeFile).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/\._|^\._/),
      expect.anything(),
      expect.anything(),
    );
    expect(writeFile).not.toHaveBeenCalledWith('.DS_Store', expect.anything(), expect.anything());
    expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
    expect(revision.revision).toBe(1);
  });

  it('applies writes and deletes and increments revision', async () => {
    const readFile = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ revision: 2, updatedAt: '2026-03-24T00:00:00.000Z' }));
    const writeFile = jest.fn().mockResolvedValue(undefined);
    const deleteFile = jest.fn().mockResolvedValue(undefined);
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const workspace = new ManagedWorkspace({ readFile, writeFile, deleteFile, mkdir } as never);

    const result = await workspace.applyUpdate({
      writes: [{ path: 'src/app.ts', content: 'export const next = true;' }],
      deletes: ['src/old.ts'],
    });

    expect(writeFile).toHaveBeenCalledWith('src/app.ts', 'export const next = true;', { recursive: true });
    expect(deleteFile).toHaveBeenCalledWith('src/old.ts', { recursive: true, force: true });
    expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
    expect(result.revision.revision).toBe(3);
    expect(result.writeCount).toBe(1);
    expect(result.deleteCount).toBe(1);
  });

  it('reads a single file by path', async () => {
    const readFile = jest.fn().mockResolvedValue('export const x = 1;');
    const workspace = new ManagedWorkspace({ readFile } as never);

    const file = await workspace.readFile('src/app.ts');

    expect(readFile).toHaveBeenCalledWith('src/app.ts');
    expect(file).toEqual({ path: 'src/app.ts', content: 'export const x = 1;' });
  });

  it('returns snapshot files and excludes reserved metadata content', async () => {
    const readdir = jest
      .fn()
      .mockResolvedValueOnce([
        { name: '.agent', type: 'directory' },
        { name: 'src', type: 'directory' },
        { name: 'README.md', type: 'file' },
      ])
      .mockResolvedValueOnce([{ name: 'app.ts', type: 'file' }]);
    const readFile = jest.fn(async (path: string) => {
      if (path === '.agent/revision.json') {
        return JSON.stringify({ revision: 4, updatedAt: '2026-03-24T00:00:00.000Z' });
      }

      if (path === 'README.md') {
        return '# Demo';
      }

      if (path === 'src/app.ts') {
        return 'export default {}';
      }

      throw new Error(`Unexpected read: ${path}`);
    });
    const workspace = new ManagedWorkspace({ readdir, readFile } as never);

    const snapshot = await workspace.readSnapshot();

    expect(snapshot.revision.revision).toBe(4);
    expect(snapshot.files).toEqual([
      { path: 'README.md', content: '# Demo' },
      { path: 'src/app.ts', content: 'export default {}' },
    ]);
  });
});
