// Generates the OpenAPI specs the MCP server bundles into api-specs/: one minified JSON file per service, plus
// index.json. Node services are generated the way their webpack build does it (swagger-jsdoc over the app's
// swagger.config.js, src/**/*.ts and src/**/*.swagger.yml). Services listed with `spec` use that static file.
// Run with --write to regenerate, or --check to fail when the committed specs are out of date.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const swaggerJsdoc = require('swagger-jsdoc');
const yaml = require('js-yaml');

const LIB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOT = resolve(LIB_ROOT, '../..');
const OUTPUT_DIR = join(LIB_ROOT, 'api-specs');
const SERVICES = JSON.parse(readFileSync(join(LIB_ROOT, 'scripts/api-services.json'), 'utf8'));
const UPDATE_COMMAND = 'npx nx run adsp-sdk-mcp-server:sync-content';
const OPENAPI_KEYS = ['openapi', 'info', 'servers', 'paths', 'components', 'security', 'tags', 'externalDocs'];

function sortKeys(object) {
  return Object.fromEntries(
    Object.keys(object)
      .sort()
      .map((key) => [key, object[key]]),
  );
}

/**
 * Guards the bundle against fragment mistakes that a service's own swagger.json tolerates: a path without its
 * leading `/`, and top-level keys that aren't OpenAPI. Paths and components are sorted, so the output doesn't
 * depend on file system order.
 */
export function normalizeSpec(spec) {
  const normalized = Object.fromEntries(OPENAPI_KEYS.filter((key) => key in spec).map((key) => [key, spec[key]]));
  normalized.paths = sortKeys(
    Object.fromEntries(
      Object.entries(spec.paths ?? {}).map(([path, item]) => [path.startsWith('/') ? path : `/${path}`, item]),
    ),
  );
  if (normalized.components) {
    normalized.components = Object.fromEntries(
      Object.entries(normalized.components).map(([kind, items]) => [kind, sortKeys(items)]),
    );
  }
  return normalized;
}

function generateSpec({ app, spec }) {
  if (spec) {
    return yaml.load(readFileSync(join(WORKSPACE_ROOT, spec), 'utf8'));
  }

  // The apis globs are relative to the working directory, as in the apps' webpack configs.
  process.chdir(WORKSPACE_ROOT);
  return swaggerJsdoc({
    swaggerDefinition: require(join(WORKSPACE_ROOT, 'apps', app, 'swagger.config.js')),
    apis: [`apps/${app}/src/**/*.ts`, `apps/${app}/src/**/*.swagger.yml`],
  });
}

function unmappedApps() {
  const known = new Set([...SERVICES.services.map(({ app }) => app), ...Object.keys(SERVICES.excluded)]);
  return readdirSync(join(WORKSPACE_ROOT, 'apps')).filter(
    (app) => existsSync(join(WORKSPACE_ROOT, 'apps', app, 'swagger.config.js')) && !known.has(app),
  );
}

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);

function countOperations(spec) {
  return Object.values(spec.paths).reduce(
    (count, item) => count + Object.keys(item).filter((key) => HTTP_METHODS.has(key)).length,
    0,
  );
}

/** File name → content, for everything in api-specs/. */
export function generateApiSpecs() {
  const unmapped = unmappedApps();
  if (unmapped.length > 0) {
    throw new Error(
      `${unmapped.join(', ')}: has a swagger.config.js but no entry in libs/adsp-sdk-mcp-server/scripts/` +
        'api-services.json. Add it under services (with its URN) or under excluded.',
    );
  }

  const files = {};
  const index = [];
  for (const service of SERVICES.services) {
    const spec = normalizeSpec(generateSpec(service));
    const operations = countOperations(spec);
    if (operations === 0) {
      throw new Error(`The OpenAPI spec for ${service.app} has no operations.`);
    }

    const file = `${service.app}.json`;
    files[file] = `${JSON.stringify(spec)}\n`;
    index.push({ app: service.app, urn: service.urn, name: service.name, title: spec.info?.title, operations, file });
  }
  files['index.json'] = `${JSON.stringify(index, null, 2)}\n`;
  return files;
}

function readCommitted() {
  if (!existsSync(OUTPUT_DIR)) return {};
  return Object.fromEntries(
    readdirSync(OUTPUT_DIR).map((file) => [file, readFileSync(join(OUTPUT_DIR, file), 'utf8')]),
  );
}

function main(mode) {
  const files = generateApiSpecs();
  if (mode === '--write') {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });
    for (const [file, content] of Object.entries(files)) writeFileSync(join(OUTPUT_DIR, file), content);
    console.log(`Wrote ${Object.keys(files).length} files to ${relative(WORKSPACE_ROOT, OUTPUT_DIR)}/`);
    return;
  }

  const committed = readCommitted();
  const stale = [...new Set([...Object.keys(files), ...Object.keys(committed)])].filter(
    (file) => files[file] !== committed[file],
  );
  if (stale.length > 0) {
    console.error(
      `OpenAPI specs changed but ${relative(WORKSPACE_ROOT, OUTPUT_DIR)}/ was not regenerated (${stale.join(', ')}). ` +
        `Run \`${UPDATE_COMMAND}\` and commit the result with your API change.`,
    );
    process.exit(1);
  }
  console.log(`Bundled OpenAPI specs are current: ${Object.keys(files).length - 1} services.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv[2]);
}
