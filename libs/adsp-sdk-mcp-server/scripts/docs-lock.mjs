// Fingerprint of the docs/**/*.md pages the build bundles. The committed lock (src/docs/docs-lock.json) must match
// docs/, so a docs change also changes this package and releases it. Run with --write to update the lock, or
// --check to fail when it is out of date.
import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

const LIB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_ROOT = resolve(LIB_ROOT, '../../docs');
const LOCK_PATH = join(LIB_ROOT, 'src/docs/docs-lock.json');
const UPDATE_COMMAND = 'npx nx run adsp-sdk-mcp-server:sync-content';

// Same files as the build's `docs/**/*.md` asset glob, which skips dot directories.
function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdown(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

export function computeDocsLock(docsRoot = DOCS_ROOT) {
  const paths = listMarkdown(docsRoot)
    .map((path) => relative(docsRoot, path).split(sep).join('/'))
    .sort();
  const hash = createHash('sha256');
  for (const path of paths) {
    // Line endings are normalized so a CRLF checkout (Windows) gets the same fingerprint.
    const content = readFileSync(join(docsRoot, path), 'utf8').replace(/\r\n/g, '\n');
    hash.update(`${path}\0${content}\0`);
  }
  return { files: paths.length, sha256: hash.digest('hex') };
}

function main(mode) {
  const lock = computeDocsLock();
  if (mode === '--write') {
    writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);
    console.log(`Wrote ${relative(process.cwd(), LOCK_PATH)}: ${lock.files} pages, sha256 ${lock.sha256}`);
    return;
  }

  const committed = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
  if (committed.sha256 !== lock.sha256 || committed.files !== lock.files) {
    console.error(
      `docs/ changed but ${relative(process.cwd(), LOCK_PATH)} was not updated, so the MCP server would not ` +
        `release the new docs. Run \`${UPDATE_COMMAND}\` and commit the lock with your docs change.`,
    );
    process.exit(1);
  }
  console.log(`Docs lock is current: ${lock.files} pages.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv[2]);
}
