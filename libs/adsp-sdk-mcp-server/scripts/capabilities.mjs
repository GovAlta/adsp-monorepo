// Generates assets/capabilities.json, the catalog find_adsp_services ranks: one entry per ADSP service in the service index,
// plus the project-planner-service business patterns. Nothing in it is written by hand. The sources are:
// - docs/services/services.md: every service, its guide and its "Use it to" line;
// - apps/project-planner-service/src/planner/specialists.ts: purpose, fit questions, dependencies and risks;
// - apps/project-planner-service/src/planner/patterns.ts: patterns, their service mappings and known gaps;
// - libs/adsp-service-sdk/src/registration/registration.ts: which ServiceRegistration field configures which service.
// Run with --write to regenerate, or --check to fail when the committed catalog is out of date.
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const LIB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOT = resolve(LIB_ROOT, '../..');
const OUTPUT_FILE = join(LIB_ROOT, 'assets', 'capabilities.json');
const UPDATE_COMMAND = 'npx nx run adsp-sdk-mcp-server:sync-content';

const SERVICE_INDEX = 'docs/services/services.md';
const PLANNER = 'apps/project-planner-service/src/planner';
const REGISTRATION = 'libs/adsp-service-sdk/src/registration/registration.ts';

function read(path) {
  return readFileSync(join(WORKSPACE_ROOT, path), 'utf8');
}

/**
 * Loads a planner module's exports by transpiling it with the TypeScript compiler. The specialists and patterns are
 * plain data whose imports are all types, which transpiling drops, so the module needs no `require` of its own.
 */
function loadPlanner(module) {
  const path = `${PLANNER}/${module}.ts`;
  const { outputText } = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  });
  const exports = {};
  const unexpected = (name) => {
    throw new Error(`${path} imports ${name} at run time; the catalog generator can only load type imports.`);
  };
  new Function('exports', 'require', outputText)(exports, unexpected);
  return exports;
}

/** The service index tables: `| [Name](id.md) | Use it to … |`, in index order. */
export function parseServiceIndex(markdown) {
  const services = [];
  for (const [, name, id, use] of markdown.matchAll(/^\|\s*\[([^\]]+)\]\(([a-z-]+)\.md\)\s*\|\s*(.+?)\s*\|\s*$/gm)) {
    services.push({ id, name, use });
  }
  return services;
}

/**
 * ServiceRegistration field → the platform service the SDK writes it to, read from the SDK's registration code:
 * each `if (registration.<field>)` block ends in `updateConfiguration(adspId\`urn:ads:platform:<service>\`, …)` or
 * `...(adspId\`urn:ads:platform:<service>\`, …)`.
 */
export function parseRegistrationFields(source) {
  const fields = {};
  const blocks = source.split(/\n\s*if \(registration\./).slice(1);
  for (const block of blocks) {
    const field = /^(\w+)\)/.exec(block)?.[1];
    const service = /adspId`urn:ads:platform:([a-z-]+)`/.exec(block)?.[1];
    if (field && service && field !== 'serviceConfigurations') {
      (fields[service] ??= []).push(field);
    }
  }
  return fields;
}

/** File name → content, for the generated catalog. */
export function generateCapabilities() {
  const index = parseServiceIndex(read(SERVICE_INDEX));
  const { SPECIALISTS } = loadPlanner('specialists');
  const { BUILT_IN_PATTERNS } = loadPlanner('patterns');
  const registrationFields = parseRegistrationFields(read(REGISTRATION));

  const indexed = new Set(index.map(({ id }) => id));
  const unindexed = [
    ...SPECIALISTS.map(({ service }) => service),
    ...BUILT_IN_PATTERNS.flatMap(({ serviceMappings }) => serviceMappings.map(({ service }) => service)),
  ].filter((service) => !indexed.has(service));
  if (unindexed.length > 0) {
    throw new Error(
      `${[...new Set(unindexed)].join(', ')}: used by the planner but missing from ${SERVICE_INDEX}. ` +
        'Add the service to the index, or remove it from the planner.',
    );
  }

  const services = index.map(({ id, name, use }) => {
    const specialist = SPECIALISTS.find(({ service }) => service === id);
    const guide = `services/${id}.md`;
    if (!existsSync(join(WORKSPACE_ROOT, 'docs', guide))) {
      throw new Error(`${SERVICE_INDEX} links ${guide}, which does not exist.`);
    }
    return {
      id,
      name,
      use,
      doc: guide,
      specialist: Boolean(specialist),
      purpose: specialist?.purpose ?? null,
      fitQuestions: specialist?.questions ?? [],
      dependsOn: specialist?.dependsOn ?? [],
      risks: specialist?.risks ?? [],
      registrationFields: registrationFields[id] ?? [],
      patterns: BUILT_IN_PATTERNS.flatMap(({ id: pattern, serviceMappings }) =>
        serviceMappings.filter(({ service }) => service === id).map(({ reason }) => ({ pattern, reason })),
      ),
    };
  });

  const patterns = BUILT_IN_PATTERNS.map((pattern) => ({
    id: pattern.id,
    name: pattern.name,
    domainLanguage: pattern.domainLanguage,
    signals: pattern.strongSignals.flatMap(({ keywords }) => keywords),
    commonFeatures: pattern.commonFeatures,
    services: pattern.serviceMappings.map(({ service }) => service),
    unsupported: (pattern.unsupportedCapabilities ?? []).map(({ requirement, reason, suggestedApproach, keywords }) => ({
      requirement,
      reason,
      suggestedApproach,
      keywords: keywords ?? [],
    })),
  }));

  return {
    'capabilities.json': `${JSON.stringify({ sources: [SERVICE_INDEX, `${PLANNER}/specialists.ts`, `${PLANNER}/patterns.ts`, REGISTRATION], services, patterns }, null, 2)}\n`,
  };
}

function main(mode) {
  const { 'capabilities.json': content } = generateCapabilities();
  if (mode === '--write') {
    writeFileSync(OUTPUT_FILE, content);
    console.log(`Wrote ${relative(WORKSPACE_ROOT, OUTPUT_FILE)}`);
    return;
  }

  const committed = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, 'utf8') : undefined;
  if (committed !== content) {
    console.error(
      `The planner's specialists or patterns, ${SERVICE_INDEX} or the SDK's registration changed, but ` +
        `${relative(WORKSPACE_ROOT, OUTPUT_FILE)} was not regenerated. Run \`${UPDATE_COMMAND}\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log(`Capability catalog is current: ${JSON.parse(content).services.length} services.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv[2]);
}
