import type { JsonSchema7 } from '@jsonforms/core';
import Ajv, { ErrorObject } from 'ajv';
/* eslint-disable @typescript-eslint/no-explicit-any */
type RequiredStrategy = 'bestMatch' | 'union' | 'intersection';
type Options = {
  /** anyOf/oneOf required */
  strategy?: RequiredStrategy;
  ajv?: Ajv;
};

const isObject = (v: unknown): v is Record<string, any> => v !== null && typeof v === 'object' && !Array.isArray(v);

const splitPath = (path: string): string[] =>
  path
    .replace(/^#\/properties\//, '')
    .replace(/\//g, '.')
    .split('.')
    .filter(Boolean);

const getDataAt = (rootData: any, pathSegs: string[]): any => {
  let cur = rootData;
  for (const seg of pathSegs) {
    if (cur == null) return undefined;

    if (Array.isArray(cur) && /^\d+$/.test(seg)) {
      cur = cur[Number(seg)];
    } else {
      cur = cur[seg];
    }
  }
  return cur;
};

const forEachComposedSubSchema = (schema: any, callback: (subSchema: any) => void): void => {
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(schema[key])) {
      schema[key].forEach(callback);
    }
  }

  if (schema.not) {
    callback(schema.not);
  }
};

const collectConditionPropertyPaths = (schema: any, basePath: string): string[] => {
  if (!schema || typeof schema !== 'object') return [];

  const paths: string[] = [];

  if (isObject(schema.properties)) {
    for (const [key, subSchema] of Object.entries(schema.properties)) {
      const nextPath = basePath ? `${basePath}.${key}` : key;
      paths.push(nextPath, ...collectConditionPropertyPaths(subSchema, nextPath));
    }
  }

  forEachComposedSubSchema(schema, (subSchema) => {
    paths.push(...collectConditionPropertyPaths(subSchema, basePath));
  });

  return paths;
};

const hasExplicitRequired = (schema: any): boolean => {
  if (!schema || typeof schema !== 'object') return false;
  if (Array.isArray(schema.required) && schema.required.length > 0) return true;

  let found = false;
  forEachComposedSubSchema(schema, (subSchema) => {
    found = found || hasExplicitRequired(subSchema);
  });
  return found;
};

const hasAnyConditionPropertyValue = (schema: any, rootData: any, basePath: string): boolean => {
  const paths = collectConditionPropertyPaths(schema, basePath);
  return paths.length === 0 || paths.some((path) => getDataAt(rootData, splitPath(path)) !== undefined);
};

// Compiling a subschema is far more expensive than running it, and the `if`/`oneOf` branches of a
// form definition are stable objects that get revisited on every pass over the schema. Caching per
// Ajv instance keeps a caller's custom formats and keywords from leaking into another's results.
const compiledValidators = new WeakMap<Ajv, WeakMap<object, ReturnType<Ajv['compile']>>>();

const getValidator = (ajv: Ajv, schema: any): ReturnType<Ajv['compile']> => {
  if (schema === null || typeof schema !== 'object') {
    return ajv.compile(schema);
  }

  let perInstance = compiledValidators.get(ajv);
  if (!perInstance) {
    perInstance = new WeakMap();
    compiledValidators.set(ajv, perInstance);
  }

  const cached = perInstance.get(schema);
  if (cached) {
    return cached;
  }

  // A reused instance already holds every $id it has seen, so a definition that repeats one would
  // now throw where a throwaway instance did not. Fall back rather than change what callers see.
  let validate: ReturnType<Ajv['compile']>;
  try {
    validate = ajv.compile(schema);
  } catch {
    validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
  }

  perInstance.set(schema, validate);
  return validate;
};

const compileAndTest = (ajv: Ajv, schema: any, data: any): { valid: boolean; errors?: ErrorObject[] } => {
  const validate = getValidator(ajv, schema);
  const ok = validate(data) as boolean;
  return { valid: ok, errors: validate.errors ?? undefined };
};

const pickBranch = (ajv: Ajv, branches: any[], data: any, strategy: RequiredStrategy): any[] => {
  const results = branches.map((s) => compileAndTest(ajv, s, data));

  const validIdx = results.map((r, i) => (r.valid ? i : -1)).filter((i) => i >= 0);

  if (validIdx.length > 0) {
    if (strategy === 'union') return validIdx.map((i) => branches[i]);
    if (strategy === 'intersection') return validIdx.map((i) => branches[i]);
    // bestMatch
    return [branches[validIdx[0]]];
  }

  if (strategy === 'bestMatch') {
    let best = 0;
    let bestCount = Number.POSITIVE_INFINITY;
    results.forEach((r, i) => {
      const c = r.errors?.length ?? 9999;
      if (c < bestCount) {
        bestCount = c;
        best = i;
      }
    });
    return [branches[best]];
  }

  return branches;
};

const mergeSets = (a: Set<string>, b: Set<string>) => {
  b.forEach((x) => a.add(x));
};

const intersectSets = (sets: Set<string>[]): Set<string> => {
  if (sets.length === 0) return new Set<string>();
  const [first, ...rest] = sets;
  const out = new Set<string>();
  first.forEach((x) => {
    if (rest.every((s) => s.has(x))) out.add(x);
  });
  return out;
};

const collectRequired = (
  ajv: Ajv,
  schema: any,
  rootSchema: any,
  rootData: any,
  basePath: string,
  strategy: RequiredStrategy
): Set<string> => {
  const requiredPaths = new Set<string>();

  if (!schema || typeof schema !== 'object') return requiredPaths;

  const dataHere = basePath ? getDataAt(rootData, splitPath(basePath)) : rootData;

  if (schema.if && (schema.then || schema.else)) {
    const shouldEvaluateCondition =
      hasExplicitRequired(schema.if) || hasAnyConditionPropertyValue(schema.if, rootData, basePath);
    const ifResult = shouldEvaluateCondition ? compileAndTest(ajv, schema.if, dataHere) : null;
    const branch = ifResult ? (ifResult.valid ? schema.then : schema.else) : null;
    if (branch) {
      mergeSets(requiredPaths, collectRequired(ajv, branch, rootSchema, rootData, basePath, strategy));
    }
  }

  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((sub: any) => {
      mergeSets(requiredPaths, collectRequired(ajv, sub, rootSchema, rootData, basePath, strategy));
    });
  }

  const altKey = Array.isArray(schema.oneOf) ? 'oneOf' : Array.isArray(schema.anyOf) ? 'anyOf' : null;
  if (altKey) {
    const branches = schema[altKey] as any[];
    const chosen = pickBranch(ajv, branches, dataHere, strategy);

    if (strategy === 'intersection') {
      const sets = chosen.map((sub) => collectRequired(ajv, sub, rootSchema, rootData, basePath, strategy));
      return intersectSets([requiredPaths, ...sets]);
    }

    chosen.forEach((sub) => {
      mergeSets(requiredPaths, collectRequired(ajv, sub, rootSchema, rootData, basePath, strategy));
    });
  }

  if (Array.isArray(schema.required)) {
    for (const key of schema.required as string[]) {
      requiredPaths.add(basePath ? `${basePath}.${key}` : key);
    }
  }

  if (isObject(schema.properties)) {
    for (const [key, subSchema] of Object.entries(schema.properties)) {
      const nextPath = basePath ? `${basePath}.${key}` : key;
      mergeSets(requiredPaths, collectRequired(ajv, subSchema, rootSchema, rootData, nextPath, strategy));
    }
  }

  if (schema.type === 'array' && schema.items) {
    const nextPath = basePath ? `${basePath}.0` : '0';
    mergeSets(requiredPaths, collectRequired(ajv, schema.items, rootSchema, rootData, nextPath, strategy));
  }

  return requiredPaths;
};

type RequiredPathsCache = {
  rootSchema: unknown;
  rootData: unknown;
  strategy: RequiredStrategy;
  ajv?: Ajv;
  paths: Set<string>;
};

let requiredPathsCache: RequiredPathsCache | undefined;

/**
 * The required-path set depends only on the root schema and the root data, so every control on a
 * page asks for the very same set. Recomputing it per control meant walking the whole schema — and
 * compiling every `if`/`oneOf` branch it contains — once for each field on screen, which is the
 * single most expensive thing a large conditional form does on a keystroke.
 *
 * Schema and data are replaced rather than mutated on a change, so identity is a safe key.
 */
// A single instance so the compiled-validator cache above survives between renders; a throwaway
// instance per call would recompile every branch of the schema each time.
const defaultRequiredAjv = new Ajv({
  allErrors: true,
  strict: false,
});

const getRequiredPaths = (
  rootSchema: JsonSchema7,
  rootData: any,
  strategy: RequiredStrategy,
  suppliedAjv?: Ajv,
): Set<string> => {
  if (
    requiredPathsCache &&
    requiredPathsCache.rootSchema === rootSchema &&
    requiredPathsCache.rootData === rootData &&
    requiredPathsCache.strategy === strategy &&
    requiredPathsCache.ajv === suppliedAjv
  ) {
    return requiredPathsCache.paths;
  }

  const ajv = suppliedAjv ?? defaultRequiredAjv;

  const paths = collectRequired(ajv, rootSchema, rootSchema, rootData, '', strategy);
  requiredPathsCache = { rootSchema, rootData, strategy, ajv: suppliedAjv, paths };

  return paths;
};

export const isRequiredBySchema = (
  rootSchema: JsonSchema7,
  rootData: any,
  path?: string,
  options: Options = {}
): boolean => {
  if (!path) return false;

  const strategy = options.strategy ?? 'bestMatch';
  const reqSet = getRequiredPaths(rootSchema, rootData, strategy, options.ajv);

  const dotPath = splitPath(path).join('.');
  return reqSet.has(dotPath);
};
