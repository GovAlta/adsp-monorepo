import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Version of this package, read at runtime from the package.json next to `src/`.
 *
 * Read at runtime rather than imported: semantic-release writes the release version into the dist package.json
 * after the build, so a build-time import would capture the placeholder version in the source package.json.
 */
export function readPackageVersion(): string {
  try {
    return JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
