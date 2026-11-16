import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const LIB_ROOT = join(__dirname, '../..');
const API_SPECS_SCRIPT = join(LIB_ROOT, 'scripts/api-specs.mjs');

/** Runs normalizeSpec from the generator (an ES module) in a child Node process. */
function normalize(spec: unknown): Record<string, unknown> {
  const script =
    `import { normalizeSpec } from ${JSON.stringify(pathToFileURL(API_SPECS_SCRIPT).href)};` +
    'process.stdout.write(JSON.stringify(normalizeSpec(JSON.parse(process.argv[1]))));';
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script, JSON.stringify(spec)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(output);
}

describe('bundled OpenAPI specs', () => {
  // Fails when a service's OpenAPI source changes without regenerating api-specs/, and when an app with a
  // swagger.config.js is neither bundled nor excluded in scripts/api-services.json.
  it('match what the services generate', () => {
    expect(() =>
      execFileSync(process.execPath, [API_SPECS_SCRIPT, '--check'], { cwd: LIB_ROOT, stdio: 'pipe' }),
    ).not.toThrow();
  }, 60_000);

  it('index every bundled service with its URN and operation count', () => {
    const index = JSON.parse(readFileSync(join(LIB_ROOT, 'api-specs/index.json'), 'utf8'));

    expect(index).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ app: 'tenant-management-api', urn: 'urn:ads:platform:tenant-service' }),
        expect.objectContaining({ app: 'pii-service', urn: 'urn:ads:platform:pii-service' }),
      ]),
    );
    for (const service of index) {
      expect(service.operations).toBeGreaterThan(0);
    }
  });
});

describe('normalizeSpec', () => {
  it('adds a missing leading slash to a path', () => {
    expect(Object.keys(normalize({ openapi: '3.0.0', paths: { 'metrics/v1/metrics': {} } }).paths as object)).toEqual([
      '/metrics/v1/metrics',
    ]);
  });

  it('drops top-level keys that are not OpenAPI', () => {
    expect(Object.keys(normalize({ openapi: '3.0.0', paths: {}, responses: {} }))).toEqual(['openapi', 'paths']);
  });

  it('sorts paths and components so output does not depend on file order', () => {
    const spec = normalize({
      openapi: '3.0.0',
      paths: { '/b': {}, '/a': {} },
      components: { schemas: { Z: {}, A: {} } },
    });

    expect(Object.keys(spec.paths as object)).toEqual(['/a', '/b']);
    expect(Object.keys((spec.components as { schemas: object }).schemas)).toEqual(['A', 'Z']);
  });
});
