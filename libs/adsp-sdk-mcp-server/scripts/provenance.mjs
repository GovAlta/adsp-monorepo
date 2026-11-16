// Records where the bundled content came from, for get_adsp_mcp_server_info, in the built package root next to
// package.json. Run it after the build:
//   - by the release target, before semantic-release publishes (semantic-release then sets the version);
//   - with --source-build by deployments that build from a branch instead of a release (e.g. the hosted server).
//     It also sets the built package.json version to `<latest release>+<branch>.<short sha>`, so the server reports
//     which release its source follows instead of the placeholder version in the source package.json.
// Needs git history and tags: check out with fetch-depth: 0. Without them the fields are null.
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DIST_ROOT = resolve(WORKSPACE_ROOT, 'dist/libs/adsp-sdk-mcp-server');
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

function latestTag(prefix) {
  return git('describe', '--tags', '--abbrev=0', '--match', `${prefix}*`)?.slice(prefix.length) ?? null;
}

/** `1.25.0` when HEAD is the release commit, otherwise `1.25.0+main.8b3ef02`. */
function sourceBuildVersion(latestRelease) {
  const atRelease = git('rev-parse', `adsp-sdk-mcp-server-v${latestRelease}^{commit}`) === git('rev-parse', 'HEAD');
  const ref = git('rev-parse', '--abbrev-ref', 'HEAD');
  // A detached checkout reports HEAD.
  const branch = (!ref || ref === 'HEAD' ? 'source' : ref).replace(/[^0-9A-Za-z-]/g, '-');
  return atRelease ? latestRelease : `${latestRelease}+${branch}.${git('rev-parse', '--short', 'HEAD')}`;
}

const sourceBuild = process.argv.includes('--source-build');
const sdkVersion = latestTag('adsp-service-sdk-v');
const latestRelease = latestTag('adsp-sdk-mcp-server-v');
const provenance = {
  kind: sourceBuild ? 'source' : 'release',
  builtAt: new Date().toISOString(),
  sourceCommit: git('rev-parse', 'HEAD'),
  // The newest release at or before the source commit. For a release build that is the previous release.
  latestRelease,
  docsCommit: git('log', '-1', '--format=%H', '--', 'docs'),
  sdk: {
    version: sdkVersion,
    commit: git('log', '-1', '--format=%H', '--', `${SDK_ROOT}/src`),
    // True when the SDK source the reference was checked against has changes after its latest release.
    unreleasedChanges: sdkVersion
      ? !!git('log', '-1', '--format=%H', `adsp-service-sdk-v${sdkVersion}..HEAD`, '--', `${SDK_ROOT}/src`)
      : null,
  },
};

mkdirSync(DIST_ROOT, { recursive: true });
writeFileSync(resolve(DIST_ROOT, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);

if (sourceBuild && latestRelease) {
  const packagePath = resolve(DIST_ROOT, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  packageJson.version = sourceBuildVersion(latestRelease);
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
console.log(JSON.stringify(provenance));
