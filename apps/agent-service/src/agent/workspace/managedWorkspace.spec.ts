import * as tarStream from 'tar-stream';
import { ManagedWorkspace, projectWorkspaceChangeFromToolResult } from './managedWorkspace';

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

describe('ManagedWorkspace', () => {
  it('rejects reserved metadata paths', () => {
    expect(() => ManagedWorkspace.validatePath('.agent/revision.json')).toThrow(
      'Reserved workspace metadata paths cannot be modified.',
    );
  });

  it('projects workspace tool results into managed workspace change events', () => {
    const result = projectWorkspaceChangeFromToolResult({
      toolName: 'workspaceFileUpdateTool',
      result: {
        workspaceChange: {
          writes: [{ path: 'src/app.ts', content: 'export default App;' }],
          deletes: ['src/old.ts'],
          revision: 5,
          updatedAt: '2026-03-24T00:05:00.000Z',
        },
      },
    });

    expect(result).toEqual({
      toolName: 'workspaceFileUpdateTool',
      writes: [{ path: 'src/app.ts', content: 'export default App;' }],
      deletes: ['src/old.ts'],
      revision: 5,
      updatedAt: '2026-03-24T00:05:00.000Z',
      writeCount: 1,
      deleteCount: 1,
    });
  });

  it('ignores tool results without workspace change metadata', () => {
    expect(
      projectWorkspaceChangeFromToolResult({
        toolName: 'formDataUpdateTool',
        result: { id: 'form-1' },
      }),
    ).toBeUndefined();
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
