/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv, { ErrorObject } from 'ajv';
import { toDataPath, getControlPath, scopeEndIs, JsonSchema7, UISchemaElement } from '@jsonforms/core';
import { isPlainObject, get } from 'lodash';

import { JSONSchema7 } from 'json-schema';

const getMissingRequiredFields = (requiredPaths: string[], data: any): string[] => {
  return requiredPaths.filter((path) => {
    const value = get(data, path);
    return value === undefined || value === null || value === '';
  });
};

type CompletionStatus = {
  isValid: boolean;
  isCompleted: boolean;
  hasAnyData: boolean;
  missingFields: string[];
  errorPaths: string[];
};

const extractErrorPaths = (errors: ErrorObject[] | null | undefined = []): string[] => {
  return (
    errors ||
    []
      .map((e) => e?.instancePath || '')
      .filter(Boolean)
      .map((path) => {
        return path
          .replace(/^\//, '')
          .replace(/\//g, '.')
          .replace(/\[(\d+)\]/g, '[$1]'); // preserves array indices
      })
  );
};

type LooseUiSchemaElement = {
  type: string;
  scope?: string;
  elements?: LooseUiSchemaElement[];
  [key: string]: any; // allow everything else
};

export const getRequiredFields = (schema: JSONSchema7, path = ''): string[] => {
  const requiredFields: string[] = [];

  const buildPath = (base: string, key: string): string => (base ? `${base}.${key}` : key);

  if (schema.type === 'object' && schema.properties) {
    const required = schema.required || [];

    for (const key of Object.keys(schema.properties)) {
      const subSchema = schema.properties[key] as JSONSchema7;
      const currentPath = buildPath(path, key);

      if (required.includes(key)) {
        requiredFields.push(currentPath);
      }

      // Recurse into nested object
      if (subSchema.type === 'object') {
        requiredFields.push(...getRequiredFields(subSchema, currentPath));
      }

      // Recurse into array items
      if (subSchema.type === 'array' && subSchema.items) {
        const itemSchema = subSchema.items as JSONSchema7;

        // If minItems > 0, consider array required
        if (subSchema.minItems && subSchema.minItems > 0) {
          requiredFields.push(currentPath); // e.g., representativeContactInformation.alternateContact
        }

        // If items have required fields, recurse
        if (itemSchema.type === 'object') {
          const itemRequiredFields = getRequiredFields(itemSchema, `${currentPath}[0]`);
          requiredFields.push(...itemRequiredFields);
        }
      }
    }
  }

  return requiredFields;
};

const extractControlPaths = (uiElement: LooseUiSchemaElement): string[] => {
  const paths: string[] = [];

  if (uiElement.type === 'Control' && uiElement.scope) {
    const dataPath = toDataPath(uiElement.scope);
    if (dataPath) paths.push(dataPath);
  }

  if (uiElement.elements && Array.isArray(uiElement.elements)) {
    for (const child of uiElement.elements) {
      paths.push(...extractControlPaths(child));
    }
  }

  return paths;
};

export const hasAnyDataInUiSchema = (uiSchema: LooseUiSchemaElement, data: any): boolean => {
  const paths = extractControlPaths(uiSchema);
  return paths.some((path) => {
    const value = get(data, path);
    return value !== undefined && value !== null && value !== '';
  });
};

const getAllFieldPaths = (schema: JSONSchema7, path = ''): string[] => {
  const allPaths: string[] = [];
  const buildPath = (base: string, key: string) => (base ? `${base}.${key}` : key);


  if (schema.type === 'object' && schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      const subSchema = schema.properties[key] as JSONSchema7;
      const currentPath = buildPath(path, key);
      allPaths.push(currentPath);

      if (subSchema.type === 'object') {
        allPaths.push(...getAllFieldPaths(subSchema, currentPath));
      }

      if (subSchema.type === 'array' && subSchema.items) {
        const itemSchema = subSchema.items as JSONSchema7;
        allPaths.push(currentPath);

        if (itemSchema.type === 'object') {
          allPaths.push(...getAllFieldPaths(itemSchema, `${currentPath}[0]`));
        }
      }
    }
  }

  return allPaths;
};

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

  for (const scope of scopes) {
    const path = toDataPath(scope);
    const value = get(data, path);

    const schemaPath = path.split('.');
    let currentSchema: any = schema;

    for (const key of schemaPath) {
      if (!currentSchema || !currentSchema.properties || !currentSchema.properties[key]) {
        currentSchema = null;
        break;
      }
      currentSchema = currentSchema.properties[key];
    }

    const isRequired =
      schemaPath.length > 1
        ? schema?.properties?.[schemaPath[0]]?.required?.includes(schemaPath[1])
        : schema?.required?.includes(path);

    const hasMinLength = currentSchema?.minLength !== undefined;

    if (
      (isRequired && (value === undefined || value === null || value === '')) ||
      (hasMinLength && typeof value === 'string' && value.length < currentSchema.minLength)
    ) {
      incomplete.push(path);
    }
  }

  return incomplete;
}


export const getPageCompletionStatus = (
  schema: JSONSchema7,
  data: any,
  ajvErrors: ErrorObject[] | null | undefined = []
): CompletionStatus => {
  const requiredPaths = getRequiredFields(schema);
  const missingFields = getMissingRequiredFields(requiredPaths, data);
  const errorPaths = extractErrorPaths(ajvErrors);

  const isCompleted = missingFields.length === 0;
  const isValid = errorPaths.length === 0;

  const hasAnyData = hasAnyDataInUiSchema(schema as unknown as LooseUiSchemaElement, data); // true ✅

  return {
    isCompleted,
    isValid,
    hasAnyData,
    missingFields,
    errorPaths,
  };
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
    const dataPaths = scopes.map((s) => '/' + toDataPath(s));

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