import { startMcpHttpServer, StartedMcpHttpServer, StartMcpHttpServerOptions } from '@abgov/adsp-sdk-mcp-server/hosted';
import * as path from 'path';

export interface StartServiceOptions extends Omit<StartMcpHttpServerOptions, 'docsRoot' | 'apiSpecsRoot'> {
  /** The container runs from the directory that holds dist/; defaults to process.cwd(). */
  cwd?: string;
}

/** The build copies the repo docs here (see the assets in project.json). */
export function bundledDocsRoot(cwd = process.cwd()): string {
  return path.resolve(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'docs');
}

/** The build copies the library's bundled OpenAPI specs here (see the assets in project.json). */
export function bundledApiSpecsRoot(cwd = process.cwd()): string {
  return path.resolve(cwd, 'dist', 'apps', 'adsp-sdk-mcp-service', 'assets', 'api-specs');
}

export function startService({ cwd, ...options }: StartServiceOptions = {}): Promise<StartedMcpHttpServer> {
  return startMcpHttpServer({ ...options, docsRoot: bundledDocsRoot(cwd), apiSpecsRoot: bundledApiSpecsRoot(cwd) });
}
