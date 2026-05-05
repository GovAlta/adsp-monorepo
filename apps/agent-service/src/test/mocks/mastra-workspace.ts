import { mkdir, readFile, readdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

type EntryType = 'file' | 'directory';

type ReaddirEntry = {
  name: string;
  type: EntryType;
};

type RecursiveOptions = {
  recursive?: boolean;
  force?: boolean;
};

export class LocalFilesystem {
  public readonly provider = 'local';
  public readonly basePath: string;

  constructor({ basePath }: { basePath: string }) {
    this.basePath = basePath;
  }

  private resolvePath(path: string): string {
    return path === '.' ? this.basePath : resolve(this.basePath, path);
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await mkdir(this.resolvePath(path), { recursive: options?.recursive ?? false });
  }

  async writeFile(path: string, content: string | Buffer, options?: { recursive?: boolean }): Promise<void> {
    const target = this.resolvePath(path);
    if (options?.recursive) {
      await mkdir(dirname(target), { recursive: true });
    }
    await writeFile(target, content);
  }

  async readFile(path: string): Promise<Buffer> {
    return readFile(this.resolvePath(path));
  }

  async deleteFile(path: string, options?: RecursiveOptions): Promise<void> {
    await rm(this.resolvePath(path), {
      force: options?.force ?? false,
      recursive: options?.recursive ?? false,
    });
  }

  async rmdir(path: string, options?: RecursiveOptions): Promise<void> {
    if (options?.recursive || options?.force) {
      await rm(this.resolvePath(path), {
        force: options?.force ?? false,
        recursive: true,
      });
      return;
    }

    await rmdir(this.resolvePath(path));
  }

  async readdir(path: string): Promise<ReaddirEntry[]> {
    const entries = await readdir(this.resolvePath(path), { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    }));
  }
}

export class Workspace {
  public readonly id: string;
  public readonly name: string;
  public readonly filesystem: LocalFilesystem;

  constructor({ id, name, filesystem }: { id: string; name: string; filesystem: LocalFilesystem }) {
    this.id = id;
    this.name = name;
    this.filesystem = filesystem;
  }

  async init(): Promise<void> {
    await mkdir(this.filesystem.basePath, { recursive: true });
  }

  async destroy(): Promise<void> {
    // No-op for tests.
  }
}
