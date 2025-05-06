import Ajv, { ErrorObject } from 'ajv';
import { toDataPath, getControlPath } from '@jsonforms/core';

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

export const getIncompletePaths = (ajv: Ajv, scopes: string[]): string[] => {
  const requiredErrorPaths: string[] | undefined = ajv?.errors
    ?.filter(
      (e) =>
        e.keyword === 'required' ||
        e.keyword === 'minLength' ||
        e.keyword === 'minItems' ||
        e.keyword === 'errorMessage'
    )
    .map((e) => {
      return getControlPath(e);
    });

  const _scopes = scopes
    .map((scope) => toDataPath(scope))
    .filter((path) => requiredErrorPaths && isErrorPathIncluded(requiredErrorPaths, path));

  return _scopes;
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
