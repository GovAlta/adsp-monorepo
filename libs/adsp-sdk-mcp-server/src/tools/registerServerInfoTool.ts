import { readFileSync } from 'fs';
import { join } from 'path';
import { DocsRepository } from '../docs/docsRepository';
import { SDK_REFERENCE } from '../sdk-reference/reference';
import { readPackageVersion } from '../version';
import { OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

/**
 * Written by scripts/provenance.mjs into the package root, next to package.json: by the release target (`release`),
 * or by a deployment that builds from a branch (`source`).
 */
export interface Provenance {
  kind: 'release' | 'source';
  builtAt: string;
  sourceCommit: string | null;
  latestRelease: string | null;
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

function describeProvenance(provenance: Provenance | null): string {
  if (!provenance) {
    return 'No provenance recorded: this server is running from source or a local build.';
  }

  const asOf = `Docs and the SDK reference are as of ${provenance.builtAt}`;
  const source =
    provenance.kind === 'source'
      ? `, built from source commit ${provenance.sourceCommit ?? 'unknown'} after release ${provenance.latestRelease ?? 'unknown'}`
      : '';
  return (
    `${asOf}${source}. The live docs are at https://govalta.github.io/adsp-monorepo; a newer version may have ` +
    'newer content.'
  );
}

export function createServerInfoTool(docs: DocsRepository, provenance = readProvenance()): ToolDefinition[] {
  const info = {
    name: 'adsp-sdk-mcp-server',
    version: readPackageVersion(),
    provenance,
    bundled: { docPages: docs.list().length, sdkReferenceSymbols: SDK_REFERENCE.length },
    note: describeProvenance(provenance),
  };

  return [
    {
      name: 'get_adsp_mcp_server_info',
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      description:
        "Report this server's version and where its bundled content came from: the docs source commit, the " +
        '@abgov/adsp-service-sdk version the SDK reference matches, and when it was built. Use it to tell a user ' +
        'when an answer may be stale.',
      inputSchema: { type: 'object', properties: {} },
      handler: () => ({ content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }),
    },
  ];
}
