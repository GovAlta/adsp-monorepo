/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv, { ErrorObject } from 'ajv';
import { toDataPath } from '@jsonforms/core';
import get from 'lodash/get';

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

function isNumber(value?: string): boolean {
  return value != null && value !== '' && !isNaN(Number(value.toString()));
}

export const getIncompletePaths = (ajv: Ajv, schema: any, data: any, scopes: string[]): string[] => {
  const incomplete: string[] = [];

  const getSchemaForPath = (rootSchema: any, schemaPath: string[]) => {
    let current = rootSchema;
    for (const key of schemaPath) {
      if (!current?.properties?.[key]) {
        return null;
      }
      current = current.properties[key];
    }
    return current;
  };

  const getParentSchemaForPath = (rootSchema: any, schemaPath: string[]) => {
    if (schemaPath.length === 0) return null;
    let current = rootSchema;
    for (let i = 0; i < schemaPath.length - 1; i++) {
      const key = schemaPath[i];
      if (!current?.properties?.[key]) {
        return null;
      }
      current = current.properties[key];
    }
    return current;
  };

  for (const scope of scopes) {
    const path = toDataPath(scope); // e.g. "applicantContactDetails.applicantMailAddress.addressLine1"
    const value = get(data, path);

    const schemaPath = path.split('.'); // ["applicantContactDetails", "applicantMailAddress", "addressLine1"]

    const parentSchema = getParentSchemaForPath(schema, schemaPath);
    const currentSchema = getSchemaForPath(schema, schemaPath);

    const leafKey = schemaPath[schemaPath.length - 1];

    // Required is always defined on the parent object of the property
    const isRequired = !!parentSchema?.required?.includes(leafKey);

    const hasMinLength = typeof currentSchema?.minLength === 'number';

    if (
      (isRequired && (value === undefined || value === null || value === '')) ||
      (hasMinLength && typeof value === 'string' && value.length < currentSchema.minLength)
    ) {
      incomplete.push(path);
    }
  }

  return incomplete;
};

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

export const getErrorsInScopes = (errors: ErrorObject[], scopes: string[]): ErrorObject[] => {
  return errors.filter((e) => {
    // transfer scope #properties/value to data path /value
    const dataPaths = scopes.map((s) => {
      const dot = toDataPath(s);
      const slash = '/' + dot.replace(/\./g, '/');
      return slash;
    });
    return dataPaths.includes(e.instancePath) || subErrorInParent(e, dataPaths);
  });
};

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
