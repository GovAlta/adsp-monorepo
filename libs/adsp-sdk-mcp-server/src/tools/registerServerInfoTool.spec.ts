import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocsRepository } from '../docs/docsRepository';
import { FIXTURE_DOCS_ROOT } from '../fixtures/toolContract';
import { SDK_REFERENCE } from '../sdk-reference/reference';
import { readPackageVersion } from '../version';
import { createServerInfoTool, Provenance, readProvenance } from './registerServerInfoTool';

const PROVENANCE: Provenance = {
  releasedAt: '2026-11-12T20:00:00.000Z',
  sourceCommit: 'abc123',
  docsCommit: 'def456',
  sdk: { version: '2.36.1', commit: '789abc', unreleasedChanges: false },
};

async function callInfo(provenance: Provenance | null) {
  const [tool] = createServerInfoTool(new DocsRepository(FIXTURE_DOCS_ROOT), provenance);
  const result = await tool.handler({});
  return JSON.parse((result.content[0] as { text: string }).text);
}

describe('get_adsp_mcp_server_info', () => {
  it('reports the version, the build provenance and what is bundled', async () => {
    const info = await callInfo(PROVENANCE);

    expect(info).toEqual({
      name: 'adsp-sdk-mcp-server',
      version: readPackageVersion(),
      provenance: PROVENANCE,
      bundled: { docPages: 2, sdkReferenceSymbols: SDK_REFERENCE.length },
      note: expect.stringContaining('as of 2026-11-12T20:00:00.000Z'),
    });
  });

  it('says when there is no provenance because it is not a released package', async () => {
    const info = await callInfo(null);

    expect(info.provenance).toBeNull();
    expect(info.note).toContain('not a released package');
  });
});

describe('readProvenance', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'adsp-provenance-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads a provenance file', () => {
    const path = join(dir, 'provenance.json');
    writeFileSync(path, JSON.stringify(PROVENANCE));

    expect(readProvenance(path)).toEqual(PROVENANCE);
  });

  it('returns null when there is no provenance file', () => {
    expect(readProvenance(join(dir, 'missing.json'))).toBeNull();
  });
});
