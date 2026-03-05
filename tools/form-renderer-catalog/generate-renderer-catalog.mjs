import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const libraryRoot = path.join(workspaceRoot, 'libs', 'jsonforms-components');
const distCatalogPath = path.join(workspaceRoot, 'dist', 'libs', 'jsonforms-components', 'renderer-catalog.json');
const sourceIndexPath = path.join(libraryRoot, 'src', 'index.ts');
const libSourceRoot = path.join(libraryRoot, 'src', 'lib');
const manualOverridesPath = path.join(__dirname, 'manual-overrides.json');

const EMPTY_SCHEMA_MATCH = {
  type: null,
  format: null,
  enum: null,
  requiredProperties: [],
  exactProperties: null,
  arrayItemType: null,
};

function main() {
  const sourceIndex = fs.readFileSync(sourceIndexPath, 'utf8');
  const manualOverrides = readJsonIfExists(manualOverridesPath) || {};

  const testerDefinitions = readTesterDefinitions(libSourceRoot);
  const helperDefinitions = readSchemaMatchHelpers(libSourceRoot);

  const inputRegistry = parseRegistryEntries(sourceIndex, ['GoABaseRenderers', 'GoARenderers']);
  const reviewRegistry = parseRegistryEntries(sourceIndex, ['GoABaseReviewRenderers', 'GoAReviewRenderers']);

  const inputTesterSet = new Set(inputRegistry.map((entry) => entry.tester));
  const reviewTesterSet = new Set(reviewRegistry.map((entry) => entry.tester));

  const allTesterSymbols = Array.from(new Set([...inputTesterSet, ...reviewTesterSet])).sort();

  const renderers = allTesterSymbols.map((testerSymbol) => {
    const definition = testerDefinitions.get(testerSymbol);
    const inferred = inferFromDefinition(definition, helperDefinitions);
    const override = manualOverrides[testerSymbol] || {};

    const base = {
      id: toKebabCase(testerSymbol.replace(/Tester$/, '')),
      tester: testerSymbol,
      kind: inferred.kind,
      ui: inferred.ui,
      match: {
        scope: inferred.match.scope,
        schema: inferred.match.schema,
      },
      rank: inferred.rank,
      supports: {
        input: inputTesterSet.has(testerSymbol),
        review: reviewTesterSet.has(testerSymbol),
      },
      fallback: inferred.fallback,
      source: {
        file: definition?.sourceFile || null,
      },
      notes: inferred.notes,
      inference: inferred.inference,
    };

    return deepMerge(base, override);
  });

  const sortedRenderers = renderers.sort((a, b) => {
    if (a.id === b.id) return a.tester.localeCompare(b.tester);
    return a.id.localeCompare(b.id);
  });

  const catalog = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceCommit: getCommitHash(),
    sourcePath: 'libs/jsonforms-components/src/index.ts',
    rendererCount: sortedRenderers.length,
    renderers: sortedRenderers,
  };

  writeJson(distCatalogPath, catalog);

  process.stdout.write(
    `Generated renderer catalog with ${sortedRenderers.length} entries at ${relativeToRoot(distCatalogPath)}\n`
  );
}

function inferFromDefinition(definition, helperDefinitions) {
  const matcherExpression = definition?.matcherExpression || '';
  const rank = definition?.rank ?? 0;
  const sourceFile = definition?.sourceFile;

  const schema = { ...EMPTY_SCHEMA_MATCH };
  const ui = {
    type: 'Control',
    options: {
      required: {},
      optional: {},
    },
  };
  const notes = [];
  let inference = 'auto';
  let kind = 'control';
  let scope = 'control';

  const uiType = matchFirst(matcherExpression, /uiTypeIs\('([^']+)'\)/);
  if (uiType) {
    ui.type = uiType;
    if (['VerticalLayout', 'HorizontalLayout', 'Group', 'Categorization'].includes(uiType)) {
      kind = 'layout';
      scope = 'layout';
    } else if (uiType !== 'Control') {
      kind = 'custom';
    }
  }

  const schemaType = matchFirst(matcherExpression, /schemaTypeIs\('([^']+)'\)/);
  if (schemaType) {
    schema.type = schemaType;
  }

  const format = matchFirst(matcherExpression, /formatIs\('([^']+)'\)/);
  if (format) {
    schema.format = format;
  }

  if (matcherExpression.includes('isStringControl')) schema.type = 'string';
  if (matcherExpression.includes('isNumberControl')) schema.type = 'number';
  if (matcherExpression.includes('isIntegerControl')) schema.type = 'integer';
  if (matcherExpression.includes('isBooleanControl')) schema.type = 'boolean';
  if (matcherExpression.includes('isDateControl')) schema.format = 'date';
  if (matcherExpression.includes('isDateTimeControl')) schema.format = 'date-time';
  if (matcherExpression.includes('isTimeControl')) schema.format = 'time';
  if (matcherExpression.includes('isEnumControl')) schema.enum = true;

  if (matcherExpression.includes('isObjectArrayControl')) {
    schema.type = 'array';
    schema.arrayItemType = 'object';
  }
  if (matcherExpression.includes('isPrimitiveArrayControl')) {
    schema.type = 'array';
    schema.arrayItemType = 'primitive';
  }

  const optionMatches = Array.from(matcherExpression.matchAll(/optionIs\('([^']+)'\s*,\s*([^\)]+)\)/g));
  for (const match of optionMatches) {
    const key = match[1];
    const value = normalizeValue(match[2]);
    ui.options.required[key] = value;
  }

  const schemaMatchHelperName = matchFirst(matcherExpression, /^\s*([A-Za-z0-9_]+)\s*$/);
  if (schemaMatchHelperName && helperDefinitions.has(schemaMatchHelperName)) {
    const helper = helperDefinitions.get(schemaMatchHelperName);
    schema.type = 'object';
    schema.requiredProperties = helper.properties;
    schema.exactProperties = helper.exact;
  }

  const helperRefs = Array.from(
    matcherExpression.matchAll(/\b([A-Za-z0-9_]+)\b/g),
    (match) => match[1]
  ).filter((symbol) => helperDefinitions.has(symbol));

  if (helperRefs.length > 0) {
    const helper = helperDefinitions.get(helperRefs[0]);
    schema.type = 'object';
    schema.requiredProperties = helper.properties;
    schema.exactProperties = helper.exact;
  }

  if (matcherExpression.includes("uischema?.options?.variant === 'pages'")) {
    ui.options.required.variant = 'pages';
  }

  if (matcherExpression.includes("uischema.options?.variant === 'stepper'") || matcherExpression.includes("variant === undefined")) {
    ui.options.optional.variant = ['stepper'];
  }

  if (matcherExpression.includes('categoriesAreValid')) {
    notes.push('Requires Categorization with valid Category children.');
  }

  if (schema.type === null && schema.format === null && schema.enum === null && schema.requiredProperties.length === 0 && optionMatches.length === 0 && !uiType) {
    inference = 'manual-required';
    notes.push('Could not fully infer matcher constraints from tester expression.');
  }

  const fallback = {
    strategy: kind === 'control' ? 'decompose-object' : 'unsupported',
    message:
      kind === 'control'
        ? 'No direct renderer match. Decompose object properties into primitive child controls or use known common schema refs.'
        : 'No compatible renderer match for the requested UI schema element.',
  };

  return {
    rank,
    kind,
    ui,
    match: {
      scope,
      schema,
    },
    fallback,
    notes,
    sourceFile,
    inference,
  };
}

function readTesterDefinitions(root) {
  const definitions = new Map();
  const files = listFiles(root).filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'));

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    const matches = content.matchAll(/export const\s+([A-Za-z0-9_]+)(?::\s*RankedTester)?\s*=\s*rankWith\(\s*(\d+)\s*,\s*([\s\S]*?)\)\s*;/g);
    for (const match of matches) {
      const symbol = match[1];
      const rank = Number(match[2]);
      const matcherExpression = match[3].trim();
      definitions.set(symbol, {
        rank,
        matcherExpression,
        sourceFile: relativeToRoot(filePath),
      });
    }
  }

  return definitions;
}

function readSchemaMatchHelpers(root) {
  const helpers = new Map();
  const files = listFiles(root).filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'));

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.matchAll(
      /export const\s+([A-Za-z0-9_]+)\s*=\s*createSchemaMatchTester\(\s*\[([\s\S]*?)\]\s*(?:,\s*(true|false))?\s*\)/g
    );

    for (const match of matches) {
      const symbol = match[1];
      const properties = Array.from(match[2].matchAll(/'([^']+)'/g), (entry) => entry[1]);
      const exact = match[3] === 'true';
      helpers.set(symbol, {
        properties,
        exact,
        sourceFile: relativeToRoot(filePath),
      });
    }
  }

  return helpers;
}

function parseRegistryEntries(source, arrayNames) {
  const entries = [];

  for (const arrayName of arrayNames) {
    const block = matchFirst(source, new RegExp(`export const\\s+${arrayName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
    if (!block) continue;

    const lineMatches = block.matchAll(/\{\s*tester:\s*([A-Za-z0-9_]+)\s*,\s*renderer:\s*([^}]+)\}/g);
    for (const match of lineMatches) {
      entries.push({
        tester: match[1],
        renderer: match[2].trim(),
      });
    }
  }

  return entries;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source === undefined ? target : source;
  }

  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (Array.isArray(sourceValue)) {
      result[key] = [...sourceValue];
    } else if (sourceValue && typeof sourceValue === 'object') {
      result[key] = deepMerge(targetValue && typeof targetValue === 'object' ? targetValue : {}, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

function listFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeValue(raw) {
  const value = raw.trim();

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith("'")) return value.slice(1, -1);
  if (value.startsWith('"')) return value.slice(1, -1);

  return value;
}

function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8')
      .trim();
  } catch {
    return 'unknown';
  }
}

function matchFirst(input, regex) {
  const match = input.match(regex);
  return match ? match[1] : null;
}

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function relativeToRoot(filePath) {
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

main();
