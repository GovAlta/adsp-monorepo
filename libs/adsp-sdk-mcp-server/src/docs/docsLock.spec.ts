import { execFileSync } from 'child_process';
import { join } from 'path';

const DOCS_LOCK_SCRIPT = join(__dirname, '../../scripts/docs-lock.mjs');

describe('docs lock', () => {
  // Fails when docs/ changes without the lock, so every docs change also changes (and releases) this package.
  it('matches the docs the build bundles', () => {
    expect(() => execFileSync(process.execPath, [DOCS_LOCK_SCRIPT, '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
