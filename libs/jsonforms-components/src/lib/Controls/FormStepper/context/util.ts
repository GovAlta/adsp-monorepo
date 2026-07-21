import { JsonSchema, toDataPath } from '@jsonforms/core';
import get from 'lodash/get';
import type { ErrorObject } from 'ajv';
import { buildConditionalDeps } from '../util/conditionalDeps';
import { StepStatus, StepStatusType, VALIDATION_KEYWORDS } from '../../../common/Constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValueAtPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasMeaningfulValue(val: any): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') return val.trim() !== '';
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
}

function getSubSchema(schema: JsonSchema, path: string): any {
  const parts = path
    .replace(/^#\//, '')
    .split('/')
    .filter((p) => p !== 'properties') // remove 'properties' segments
    .slice(0, -1);

  let current: any = schema;
  for (const part of parts) {
    if (!current) return undefined;

    if (current.properties && current.properties[part]) {
      current = current.properties[part];
    } else if (current.items) {
      current = current.items;
    } else {
      return undefined;
    }
  }
  return current;
}

// Checks whether any of the given normalized scopes (dot-path form, e.g. "a.b.c")
// resolve to a property name present in the required array. Returns true if at
// least one scope's property name is required, false otherwise.
export function isScopeRequired(normalizedScopes: string[], required: string[]): boolean {
  if (!normalizedScopes?.length || !required?.length) return false;

  return normalizedScopes.some((scope) => {
    const propertyName = scope.split('.').pop();
    return !!propertyName && required.includes(propertyName);
  });
}

// Aggregates the required property names applicable to a step's scopes: the
// schema's top-level required array plus the required array of each scope's
// immediate parent (sub)schema (for nested objects).
function getRequiredForScopes(scopes: string[], schema: JsonSchema): string[] {
  const topLevelRequired: string[] = (schema as { required?: string[] })?.required || [];

  const scopeSets = scopes.reduce((acc: string[], scope) => {
    const subSchema = getSubSchema(schema, scope);
    return acc.concat(subSchema?.required || []);
  }, topLevelRequired);

  return Array.from(new Set(scopeSets));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyRequiredFieldEmpty(scopes: string[], data: any, required: string[], schema: JsonSchema): boolean {
  for (const scope of scopes) {
    const path = scope
      .replace(/^#\//, '')
      .split('/')
      .filter((p) => p !== 'properties');

    const subSchema = getSubSchema(schema, scope);
    let value = data;
    const requiredSubset = subSchema;

    for (const key of path) {
      if (value && key in value) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }

    required = required.concat(requiredSubset?.required || []);

    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    ) {
      if (required.includes(path[path.length - 1])) {
        return true;
      }
    }
  }

  return false;
}

// Resolve a single schema scope against the provided data and determine whether
// it already holds a meaningful value. Used to derive the initial "visited"
// state of a step from populated form data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasValueAtScope(data: any, scope: string): boolean {
  const path = normalizeSchemaPath(scope);
  if (!path) return false;
  return hasMeaningfulValue(getValueAtPath(data, path));
}

interface StepStatusData {
  status: StepStatusType;
  hasRequiredFields: boolean;
}
export function getStepStatus(opts: {
  scopes: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  errors: AjvError[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: JsonSchema;
  visited?: boolean;
}): StepStatusData {
  const { scopes, errors, schema, data, visited } = opts;

  const normalizedScopes = scopes.map(normalizeSchemaPath).filter(Boolean);

  // A step with no required fields has nothing that must be filled in, so once
  // the user has visited it (e.g. navigated back to the application overview
  // page) it is trivially Completed, regardless of whether its optional
  // fields hold any data.
  const requiredForScopes = getRequiredForScopes(scopes, schema);

  const stepHasRequiredFields = isScopeRequired(normalizedScopes, requiredForScopes);

  // NotStarted is data-driven: if any scoped field has a defined value the step has been started.
  // For non-standard scopes that cannot be normalised, fall back to the visited flag so those
  // steps are never stuck in NotStarted when the form is pre-populated or already visited.
  const stepHasData =
    normalizedScopes.length > 0
      ? normalizedScopes.some((path) => hasMeaningfulValue(get(data || {}, path)))
      : (visited ?? false);

  if (!stepHasRequiredFields && (visited || stepHasData)) {
    return { status: StepStatus.COMPLETED, hasRequiredFields: stepHasRequiredFields };
  }

  if (!stepHasData) {
    return { status: StepStatus.NOT_STARTED, hasRequiredFields: stepHasRequiredFields };
  }
  const incompleteInStep = getIncompletePaths(errors, scopes);

  if (incompleteInStep.length > 0) {
    return { status: StepStatus.IN_PROGRESS, hasRequiredFields: stepHasRequiredFields };
  }

  const required = schema.required || [];

  if (anyRequiredFieldEmpty(scopes, data, required, schema)) {
    return { status: StepStatus.IN_PROGRESS, hasRequiredFields: stepHasRequiredFields };
  }

  const deps = buildConditionalDeps(schema);
  const controllersInStep = normalizedScopes.filter((s) => deps.has(s));

  if (controllersInStep.length === 0) {
    return { status: StepStatus.COMPLETED, hasRequiredFields: stepHasRequiredFields };
  }

  const affected = new Set<string>();

  for (const controller of controllersInStep) {
    for (const path of deps.get(controller) || []) {
      affected.add(path);
    }
  }

  if (affected.size === 0) {
    return { status: StepStatus.COMPLETED, hasRequiredFields: stepHasRequiredFields };
  }

  const affectedPaths = [...affected];

  for (const err of errors || []) {
    for (const candidate of collectErrorCandidates(err)) {
      if (affectedPaths.some((path) => isUnder(candidate, path))) {
        return { status: StepStatus.IN_PROGRESS, hasRequiredFields: stepHasRequiredFields };
      }
    }
  }

  return { status: StepStatus.COMPLETED, hasRequiredFields: stepHasRequiredFields };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const missing = (e.params as any)?.missingProperty as string | undefined;
  if (e.keyword === VALIDATION_KEYWORDS.REQUIRED && missing) {
    const base = normalizeInstancePath(e.instancePath || '');
    out.push(base ? `${base}.${missing}` : missing);
  }

  if (e.instancePath) out.push(normalizeInstancePath(e.instancePath));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missingProperty = (error.params as any)?.missingProperty as string | undefined;
    const candidates: string[] = [];

    if (error.keyword === VALIDATION_KEYWORDS.REQUIRED && missingProperty) {
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
        (scope) => candidate === scope || candidate.startsWith(scope + '.') || scope.startsWith(candidate + '.'),
      );
      if (!match) continue;
      incomplete.add(match);
    }
  }

  const result = [...incomplete];

  return result;
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

    if (err.keyword === VALIDATION_KEYWORDS.REQUIRED) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
