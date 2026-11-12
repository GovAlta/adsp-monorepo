// Records where the bundled content came from, for get_adsp_mcp_server_info. The release target runs it after the
// build, writing into the built package root next to package.json. Needs git history and tags (CI checks out with
// fetch-depth: 0).
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUTPUT_PATH = resolve(WORKSPACE_ROOT, 'dist/libs/adsp-sdk-mcp-server/provenance.json');
const SDK_ROOT = 'libs/adsp-service-sdk';

function git(...args) {
  try {
    return (
      execFileSync('git', args, {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || null
    );
  } catch {
    return null;
  }
}

const sdkTag = git('describe', '--tags', '--abbrev=0', '--match', 'adsp-service-sdk-v*');
const provenance = {
  releasedAt: new Date().toISOString(),
  sourceCommit: git('rev-parse', 'HEAD'),
  docsCommit: git('log', '-1', '--format=%H', '--', 'docs'),
  sdk: {
    version: sdkTag?.replace(/^adsp-service-sdk-v/, '') ?? null,
    commit: git('log', '-1', '--format=%H', '--', `${SDK_ROOT}/src`),
    // True when the SDK source the reference was checked against has changes after its latest release.
    unreleasedChanges: sdkTag ? !!git('log', '-1', '--format=%H', `${sdkTag}..HEAD`, '--', `${SDK_ROOT}/src`) : null,
  },
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify(provenance));
