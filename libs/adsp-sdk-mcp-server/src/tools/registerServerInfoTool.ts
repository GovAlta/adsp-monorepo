import { readFileSync } from 'fs';
import { join } from 'path';
import { DocsRepository } from '../docs/docsRepository';
import { SDK_REFERENCE } from '../sdk-reference/reference';
import { readPackageVersion } from '../version';
import { ToolDefinition } from './types';

/** Written by scripts/provenance.mjs into the package root, next to package.json, when the package is released. */
export interface Provenance {
  releasedAt: string;
  sourceCommit: string | null;
  docsCommit: string | null;
  sdk: { version: string | null; commit: string | null; unreleasedChanges: boolean | null };
}

const PROVENANCE_PATH = join(__dirname, '..', '..', 'provenance.json');

export function readProvenance(path = PROVENANCE_PATH): Provenance | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function createServerInfoTool(docs: DocsRepository, provenance = readProvenance()): ToolDefinition[] {
  const info = {
    name: 'adsp-sdk-mcp-server',
    version: readPackageVersion(),
    provenance,
    bundled: { docPages: docs.list().length, sdkReferenceSymbols: SDK_REFERENCE.length },
    note: provenance
      ? `Docs and the SDK reference are as of ${provenance.releasedAt}. The live docs are at ` +
        'https://govalta.github.io/adsp-monorepo; a newer package version may have newer content.'
      : 'No provenance recorded: this server is running from source or a local build, not a released package.',
  };

  return [
    {
      name: 'get_adsp_mcp_server_info',
      description:
        "Report this server's version and where its bundled content came from: the docs source commit, the " +
        '@abgov/adsp-service-sdk version the SDK reference matches, and when it was built. Use it to tell a user ' +
        'when an answer may be stale.',
      inputSchema: { type: 'object', properties: {} },
      handler: () => ({ content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }),
    },
  ];
}
