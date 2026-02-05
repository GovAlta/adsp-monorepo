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

const compileAndTest = (ajv: Ajv, schema: any, data: any): { valid: boolean; errors?: ErrorObject[] } => {
  const validate = ajv.compile(schema);
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
    const ifResult = compileAndTest(ajv, schema.if, dataHere);
    const branch = ifResult.valid ? schema.then : schema.else;
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

  if (Array.isArray(schema.required) && isObject(schema.properties)) {
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

export const isRequiredBySchema = (
  rootSchema: JsonSchema7,
  rootData: any,
  path?: string,
  options: Options = {}
): boolean => {
  if (!path) return false;

  const ajv =
    options.ajv ??
    new Ajv({
      allErrors: true,
      strict: false,
    });

  const strategy = options.strategy ?? 'bestMatch';

  const reqSet = collectRequired(ajv, rootSchema, rootSchema, rootData, '', strategy);

  const dotPath = splitPath(path).join('.');
  return reqSet.has(dotPath);
};
