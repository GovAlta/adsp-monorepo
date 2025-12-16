/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { toDataPath } from '@jsonforms/core';
import get from 'lodash/get';
import type { ErrorObject } from 'ajv';
import { buildConditionalDeps } from '../util/conditionalDeps';

export function getStepStatus(opts: {
  scopes: string[];
  data: any;
  errors: AjvError[];
  schema: any;
}): 'Completed' | 'InProgress' | 'NotStarted' {
  const { scopes, errors, schema } = opts;

  const incompleteInStep = getIncompletePaths(errors, scopes);
  if (incompleteInStep.length > 0) return 'InProgress';

  const normalizedScopes = scopes.map(normalizeSchemaPath).filter(Boolean);
  const deps = buildConditionalDeps(schema);

  const controllersInStep = normalizedScopes.filter((s) => deps.has(s));
  if (controllersInStep.length === 0) return 'Completed';

  const affected = new Set<string>();
  for (const c of controllersInStep) {
    for (const p of deps.get(c) || []) affected.add(p);
  }

  if (affected.size === 0) return 'Completed';

  const affectedPaths = [...affected];

  for (const err of errors || []) {
    for (const cand of collectErrorCandidates(err)) {
      if (affectedPaths.some((p) => isUnder(cand, p))) {
        return 'InProgress';
      }
    }
  }

  return 'Completed';
}
export const isErrorPathIncluded = (errorPaths: string[], path: string): boolean => {
  return errorPaths.some((ePath) => {
    /**
     *  case A: errorPaths: [name] path: [name]
     *
     *  case B: errorPath: [name] path: [name.firstName]
     * */

    return ePath === path || path.startsWith(ePath + '.');
  });
};
function collectErrorCandidates(e: AjvError): string[] {
  const out: string[] = [];

  const missing = (e.params as any)?.missingProperty as string | undefined;
  if (e.keyword === 'required' && missing) {
    const base = normalizeInstancePath(e.instancePath || '');
    out.push(base ? `${base}.${missing}` : missing);
  }

  if (e.instancePath) out.push(normalizeInstancePath(e.instancePath));

  if (e.dataPath) out.push(normalizeInstancePath((e as any).dataPath));

  return out.filter(Boolean);
}

function isUnder(candidate: string, path: string) {
  return candidate === path || candidate.startsWith(path + '.');
}

function isNumber(value?: string): boolean {
  return value != null && value !== '' && !isNaN(Number(value.toString()));
}

type AjvError = ErrorObject & {
  dataPath?: string;
};

export function normalizeSchemaPath(schemaPath: string): string {
  if (!schemaPath.startsWith('#/')) return '';
  const parts = schemaPath
    .replace(/^#\//, '')
    .split('/')
    .filter((p) => p !== 'properties');
  return parts.join('.');
}

// Normalize instance/data path: "/a/b/0/c" -> "a.b[0].c" or "a.b.c" as you prefer.
// For your use case we just want "a.b.c".
export function normalizeInstancePath(instancePath: string): string {
  if (!instancePath) return '';
  const parts = instancePath.replace(/^\//, '').split('/').filter(Boolean);

  // Drop array indices to keep it simple: "a/0/b" -> "a.b"
  const filtered = parts.filter((p) => !/^\d+$/.test(p));
  return filtered.join('.');
}

export function getIncompletePaths(errors: AjvError[] | null | undefined, scopePaths: string[]): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  const normalizedScopes = scopePaths.map((p) => normalizeSchemaPath(p)).filter((p) => p && p !== '#');

  const incomplete = new Set<string>();

  for (const error of errors) {
    const missingProperty = (error.params as any)?.missingProperty as string | undefined;
    const candidates: string[] = [];

    if (error.keyword === 'required' && missingProperty) {
      candidates.push(missingProperty);

      if (error.instancePath) {
        const base = normalizeInstancePath(error.instancePath);
        if (base) {
          candidates.push(`${base}.${missingProperty}`);
        }
      }
    } else {
      if (error.instancePath) {
        const p = normalizeInstancePath(error.instancePath);
        if (p) candidates.push(p);
      }

      if (error.dataPath && error.dataPath !== error.instancePath) {
        const p = normalizeInstancePath(error.dataPath);
        if (p) candidates.push(p);
      }
    }

    if (!candidates.length) continue;

    for (const candidate of candidates) {
      const match = normalizedScopes.find(
        (scope) => candidate === scope || candidate.startsWith(scope + '.') || scope.startsWith(candidate + '.')
      );
      if (!match) continue;
      incomplete.add(match);
    }
  }

  const result = [...incomplete];

  return result;
}

export type StepStatus = 'not-started' | 'in-progress' | 'completed';

export interface StepConfig {
  id: string;
  label: string;
  scopePaths: string[];
}

export const subErrorInParent = (error: ErrorObject, paths: string[]): boolean => {
  /*
    Detect is there sub error in an object array.
    For example: error with instance path /roadmap/0/when belongs to /roadmap
  */
  const errorPaths = error.instancePath.split('/');
  if (errorPaths.length < 2) return false;

  // For case /roadmap/0
  if (errorPaths.length > 1 && isNumber(errorPaths[errorPaths.length - 1])) {
    const parentPath = errorPaths.slice(0, errorPaths.length - 1).join('/');
    return paths.includes(parentPath);
  }

  // For case /roadmap/0/when
  if (errorPaths.length > 2 && isNumber(errorPaths[errorPaths.length - 2])) {
    const parentPath = errorPaths.slice(0, errorPaths.length - 2).join('/');
    return paths.includes(parentPath);
  }

  return false;
};

export const getErrorsInScopes = (errors: ErrorObject[] | null | undefined, scopes: string[]): ErrorObject[] => {
  if (!errors || errors.length === 0) return [];
  const scopePaths = normaliseScopesToPaths(scopes);
  if (scopePaths.length === 0) return [];

  return errors.filter((err) => {
    let fullPath = '';

    if (err.keyword === 'required') {
      const missingProp = (err.params as any)?.missingProperty;
      const instancePath = err.instancePath || '';
      const instanceDot = instancePath.replace(/^\//, '').replace(/\//g, '.');
      fullPath = instanceDot ? `${instanceDot}.${missingProp}` : missingProp;
    } else {
      fullPath = (err.instancePath || '').replace(/^\//, '').replace(/\//g, '.');
    }

    if (!fullPath) return false;

    return scopePaths.some((scopePath) => {
      return fullPath === scopePath || fullPath.startsWith(scopePath + '.') || scopePath.startsWith(fullPath + '.');
    });
  });
};

const normaliseScopeToPath = (scope: string): string => {
  if (!scope) return '';

  let s = scope;

  s = s.replace(/^#\/properties\//, '');

  s = s
    .replace(/\/properties\//g, '.') // properties
    .replace(/\/items\/properties\//g, '.') // arrays with items.properties
    .replace(/^\//, ''); // any stray leading "/"

  return s;
};

const normaliseScopesToPaths = (scopes: string[] | undefined | null): string[] =>
  (scopes || []).map(normaliseScopeToPath).filter((p) => p && p.length > 0);

export const hasDataInScopes = (data: object, scopes: string[]) => {
  const dataPaths = scopes.map((s) => toDataPath(s));
  return dataPaths.map((p) => get(data, p)).some((data) => data !== undefined);
};

const getLocalStorageKeyPrefix = () => {
  return window.location.href + '_' + new Date().toISOString().slice(0, 10);
};

export function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export const saveIsVisitFromLocalStorage = (status: boolean[]) => {
  const key = getLocalStorageKeyPrefix();
  localStorage.setItem(key, JSON.stringify(status));
};

export const getIsVisitFromLocalStorage = (): boolean[] | undefined => {
  const key = getLocalStorageKeyPrefix();
  const value = localStorage.getItem(key);
  if (value && isJson(value)) {
    return JSON.parse(value);
  }
  return undefined;
};
