/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ErrorObject } from 'ajv';
import { buildConditionalDeps } from '../util/conditionalDeps';
import {
  getErrorsInScopes,
  getIncompletePaths,
  getIsVisitFromLocalStorage,
  getStepStatus,
  hasDataInScopes,
  hasMeaningfulValue,
  isErrorPathIncluded,
  isJson,
  isScopeRequired,
  normalizeInstancePath,
  normalizeSchemaPath,
  saveIsVisitFromLocalStorage,
  subErrorInParent,
} from './util';

jest.mock('../util/conditionalDeps', () => ({
  buildConditionalDeps: jest.fn(),
}));

type AjvError = ErrorObject & { dataPath?: string };

const localStorageMock = {
  store: {} as Record<string, string>,
  setItem(key: string, value: unknown) {
    this.store[key] = String(value);
  },
  getItem(key: string) {
    return this.store[key] || null;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function requiredErr(instancePath: string, missingProperty: string, schemaPath = '#/required'): AjvError {
  return {
    keyword: 'required',
    instancePath,
    schemaPath,
    params: { missingProperty },
    message: `must have required property '${missingProperty}'`,
  } as AjvError;
}

function errorMessageErr(instancePath: string, schemaPath: string, message: string): AjvError {
  return {
    keyword: 'errorMessage',
    instancePath,
    schemaPath,
    params: {},
    message,
  } as AjvError;
}

function dataPathErr(dataPath: string): AjvError {
  return {
    keyword: 'minLength',
    instancePath: '',
    dataPath,
    schemaPath: '#/properties/name/minLength',
    params: { limit: 1 },
    message: 'must NOT have fewer than 1 characters',
  } as AjvError;
}

describe('isJson', () => {
  it('returns true only for valid JSON strings', () => {
    expect(isJson('{}')).toBe(true);
    expect(isJson('[]')).toBe(true);
    expect(isJson('"hello"')).toBe(true);
    expect(isJson('test')).toBe(false);
    expect(isJson('{')).toBe(false);
  });
});

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and restores visited state for today and current URL', () => {
    const value = [true, false, true];

    saveIsVisitFromLocalStorage(value);

    expect(getIsVisitFromLocalStorage()).toEqual(value);
  });

  it('returns undefined when no value exists', () => {
    expect(getIsVisitFromLocalStorage()).toBeUndefined();
  });

  it('returns undefined when stored value is invalid JSON', () => {
    const dateKey = new Date().toISOString().slice(0, 10);
    const key = `${window.location.href}_${dateKey}`;

    localStorage.setItem(key, '[tru]');

    expect(getIsVisitFromLocalStorage()).toBeUndefined();
  });
});

describe('hasMeaningfulValue', () => {
  it('returns false for undefined, null, blank strings, empty arrays, and empty objects', () => {
    expect(hasMeaningfulValue(undefined)).toBe(false);
    expect(hasMeaningfulValue(null)).toBe(false);
    expect(hasMeaningfulValue('')).toBe(false);
    expect(hasMeaningfulValue('   ')).toBe(false);
    expect(hasMeaningfulValue([])).toBe(false);
    expect(hasMeaningfulValue({})).toBe(false);
  });

  it('returns true for non-empty strings, arrays, objects, numbers, and booleans', () => {
    expect(hasMeaningfulValue('Jane')).toBe(true);
    expect(hasMeaningfulValue(['x'])).toBe(true);
    expect(hasMeaningfulValue({ firstName: 'Jane' })).toBe(true);
    expect(hasMeaningfulValue(0)).toBe(true);
    expect(hasMeaningfulValue(false)).toBe(true);
  });
});

describe('normalizeSchemaPath', () => {
  it('converts #/properties/a/properties/b to a.b', () => {
    expect(normalizeSchemaPath('#/properties/a/properties/b')).toBe('a.b');
  });

  it('returns empty string for non #/ paths', () => {
    expect(normalizeSchemaPath('a/b')).toBe('');
  });

  it('keeps non-properties segments', () => {
    expect(normalizeSchemaPath('#/allOf/0/then/required')).toBe('allOf.0.then.required');
  });

  it('normalizes a root property scope', () => {
    expect(normalizeSchemaPath('#/properties/email')).toBe('email');
  });
});

describe('normalizeInstancePath', () => {
  it('converts /a/b/c to a.b.c', () => {
    expect(normalizeInstancePath('/a/b/c')).toBe('a.b.c');
  });

  it('drops numeric indices', () => {
    expect(normalizeInstancePath('/roadmap/0/when')).toBe('roadmap.when');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeInstancePath('')).toBe('');
  });

  it('drops multiple numeric indices', () => {
    expect(normalizeInstancePath('/sections/0/items/2/name')).toBe('sections.items.name');
  });
});

describe('getIncompletePaths', () => {
  it('returns [] when no errors are provided', () => {
    expect(getIncompletePaths([], ['#/properties/a'])).toEqual([]);
    expect(getIncompletePaths(null, ['#/properties/a'])).toEqual([]);
    expect(getIncompletePaths(undefined, ['#/properties/a'])).toEqual([]);
  });

  it('matches required error to exact nested scope', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('/applicantContactDetails', 'firstName')];

    expect(getIncompletePaths(errors, scopes)).toEqual(['applicantContactDetails.firstName']);
  });

  it('matches required error on parent object to child scope', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('', 'applicantContactDetails')];

    expect(getIncompletePaths(errors, scopes)).toEqual(['applicantContactDetails.firstName']);
  });

  it('matches non-required instancePath errors inside scope', () => {
    const scopes = ['#/properties/whichOfThemApplies'];
    const errors: AjvError[] = [
      errorMessageErr(
        '/whichOfThemApplies',
        '#/properties/whichOfThemApplies/errorMessage',
        'Choose all that apply is required',
      ),
    ];

    expect(getIncompletePaths(errors, scopes)).toEqual(['whichOfThemApplies']);
  });

  it('matches non-required dataPath errors when instancePath is empty', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [dataPathErr('/fullName')];

    expect(getIncompletePaths(errors, scopes)).toEqual(['fullName']);
  });

  it('deduplicates multiple errors for the same scope', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [
      errorMessageErr('/fullName', '#/properties/fullName/errorMessage', 'required'),
      dataPathErr('/fullName'),
    ];

    expect(getIncompletePaths(errors, scopes)).toEqual(['fullName']);
  });

  it('ignores errors that do not match any scope', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [errorMessageErr('/email', '#/properties/email/errorMessage', 'required')];

    expect(getIncompletePaths(errors, scopes)).toEqual([]);
  });

  it('ignores errors without usable candidate paths', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [
      {
        keyword: 'errorMessage',
        instancePath: '',
        schemaPath: '#/errorMessage',
        params: {},
        message: 'required',
      } as AjvError,
    ];

    expect(getIncompletePaths(errors, scopes)).toEqual([]);
  });
});

describe('isScopeRequired', () => {
  it('returns true when a required field matches a normalized scope value', () => {
    expect(isScopeRequired(['fullName', 'email'], ['fullName'], {} as any)).toBe(true);
  });

  it('returns false when no required field matches a normalized scope value', () => {
    expect(isScopeRequired(['fullName', 'email'], ['phone'], {} as any)).toBe(false);
  });
});

describe('getStepStatus', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns NotStarted when step has not been visited, even if errors exist', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const status = getStepStatus({
      scopes: ['#/properties/fullName'],
      data: {},
      errors: [errorMessageErr('/fullName', '#/properties/fullName/errorMessage', 'required')],
      schema: {},
      visited: false,
    });

    expect(status).toBe('NotStarted');
  });

  it('returns InProgress when visited step has incomplete fields in its scopes', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const status = getStepStatus({
      scopes: ['#/properties/fullName'],
      data: {},
      errors: [errorMessageErr('/fullName', '#/properties/fullName/errorMessage', 'required')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns InProgress when top-level required field is empty', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const status = getStepStatus({
      scopes: ['#/properties/fullName'],
      data: { fullName: '' },
      errors: [],
      schema: { required: ['fullName'] },
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns InProgress when nested required field is empty', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const schema = {
      properties: {
        applicantContactDetails: {
          type: 'object',
          required: ['firstName'],
          properties: {
            firstName: { type: 'string' },
          },
        },
      },
    };

    const status = getStepStatus({
      scopes: ['#/properties/applicantContactDetails/properties/firstName'],
      data: { applicantContactDetails: { firstName: '   ' } },
      errors: [],
      schema,
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns InProgress when required array field is empty', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const status = getStepStatus({
      scopes: ['#/properties/selectedOptions'],
      data: { selectedOptions: [] },
      errors: [],
      schema: { required: ['selectedOptions'] },
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns Completed when visited step has no scoped errors, no empty required fields, and no controllers', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const status = getStepStatus({
      scopes: ['#/properties/fullName'],
      data: { fullName: 'Jane Doe' },
      errors: [],
      schema: { required: ['fullName'] },
      visited: true,
    });

    expect(status).toBe('Completed');
  });

  it('returns Completed when controller step has no affected-path errors', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]]),
    );

    const status = getStepStatus({
      scopes: ['#/properties/fillingApplicationOnbehalf'],
      data: { fillingApplicationOnbehalf: 'No' },
      errors: [errorMessageErr('/whichOfThemApplies', '#/properties/whichOfThemApplies/errorMessage', 'required')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('Completed');
  });

  it('returns InProgress when controller step has required error under affected path', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]]),
    );

    const status = getStepStatus({
      scopes: ['#/properties/fillingApplicationOnbehalf'],
      data: { fillingApplicationOnbehalf: 'No' },
      errors: [requiredErr('/applicantContactDetails', 'firstName', '#/allOf/0/then/required')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns InProgress when controller step has root required error for affected path', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]]),
    );

    const status = getStepStatus({
      scopes: ['#/properties/fillingApplicationOnbehalf'],
      data: { fillingApplicationOnbehalf: 'No' },
      errors: [requiredErr('', 'applicantContactDetails', '#/allOf/0/then/required')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns InProgress when controller step has dataPath error under affected path', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]]),
    );

    const status = getStepStatus({
      scopes: ['#/properties/fillingApplicationOnbehalf'],
      data: { fillingApplicationOnbehalf: 'No' },
      errors: [dataPathErr('/applicantContactDetails/firstName')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('InProgress');
  });

  it('returns Completed when controller has no affected paths', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', []]]),
    );

    const status = getStepStatus({
      scopes: ['#/properties/fillingApplicationOnbehalf'],
      data: { fillingApplicationOnbehalf: 'No' },
      errors: [requiredErr('/applicantContactDetails', 'firstName')],
      schema: {},
      visited: true,
    });

    expect(status).toBe('Completed');
  });

  it('returns Completed when a non-normalizable scope cannot be matched to conditional deps', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map<string, string[]>([['field', ['otherField']]]));

    const status = getStepStatus({
      scopes: ['field'],
      data: { field: 'x' },
      errors: [],
      schema: {},
      visited: true,
    });

    expect(status).toBe('Completed');
  });
});

describe('getErrorsInScopes', () => {
  it('filters required error to matching scope path', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('/applicantContactDetails', 'firstName')];

    const result = getErrorsInScopes(errors, scopes);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe('required');
  });

  it('filters root required error to matching top-level scope path', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [requiredErr('', 'fullName')];

    const result = getErrorsInScopes(errors, scopes);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe('required');
  });

  it('filters non-required error to matching scope path', () => {
    const scopes = ['#/properties/whichOfThemApplies'];
    const errors: AjvError[] = [
      errorMessageErr('/whichOfThemApplies', '#/properties/whichOfThemApplies/errorMessage', 'required'),
    ];

    const result = getErrorsInScopes(errors, scopes);

    expect(result).toHaveLength(1);
    expect(result[0].keyword).toBe('errorMessage');
  });

  it('matches parent object error to child scope', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [
      errorMessageErr(
        '/applicantContactDetails',
        '#/properties/applicantContactDetails/errorMessage',
        'Applicant contact details is required',
      ),
    ];

    expect(getErrorsInScopes(errors, scopes)).toHaveLength(1);
  });

  it('returns [] when no scopes or errors are provided', () => {
    expect(getErrorsInScopes([], [])).toEqual([]);
    expect(getErrorsInScopes(undefined, ['#/properties/a'])).toEqual([]);
    expect(getErrorsInScopes(null, ['#/properties/a'])).toEqual([]);
    expect(getErrorsInScopes([requiredErr('', 'a')], [])).toEqual([]);
  });

  it('excludes errors outside provided scopes', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [errorMessageErr('/email', '#/properties/email/errorMessage', 'required')];

    expect(getErrorsInScopes(errors, scopes)).toEqual([]);
  });

  it('excludes errors without a full path', () => {
    const scopes = ['#/properties/fullName'];
    const errors: AjvError[] = [
      {
        keyword: 'errorMessage',
        instancePath: '',
        schemaPath: '#/errorMessage',
        params: {},
        message: 'required',
      } as AjvError,
    ];

    expect(getErrorsInScopes(errors, scopes)).toEqual([]);
  });
});

describe('subErrorInParent', () => {
  it('detects /roadmap/0 belongs to /roadmap', () => {
    const err = {
      instancePath: '/roadmap/0',
      keyword: 'required',
      schemaPath: '#/required',
      params: {},
    } as ErrorObject;

    expect(subErrorInParent(err, ['/roadmap'])).toBe(true);
  });

  it('detects /roadmap/0/when belongs to /roadmap', () => {
    const err = {
      instancePath: '/roadmap/0/when',
      keyword: 'required',
      schemaPath: '#/required',
      params: {},
    } as ErrorObject;

    expect(subErrorInParent(err, ['/roadmap'])).toBe(true);
  });

  it('returns false when not array-index pattern', () => {
    const err = {
      instancePath: '/roadmap/when',
      keyword: 'required',
      schemaPath: '#/required',
      params: {},
    } as ErrorObject;

    expect(subErrorInParent(err, ['/roadmap'])).toBe(false);
  });

  it('returns false when parent path is not included', () => {
    const err = {
      instancePath: '/roadmap/0/when',
      keyword: 'required',
      schemaPath: '#/required',
      params: {},
    } as ErrorObject;

    expect(subErrorInParent(err, ['/other'])).toBe(false);
  });

  it('returns false for shallow paths', () => {
    const err = { instancePath: '', keyword: 'required', schemaPath: '#/required', params: {} } as ErrorObject;

    expect(subErrorInParent(err, ['/roadmap'])).toBe(false);
  });
});

describe('hasDataInScopes', () => {
  it('returns true if any scope has defined data', () => {
    const data = { applicantContactDetails: { firstName: 'A' } };
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];

    expect(hasDataInScopes(data, scopes)).toBe(true);
  });

  it('returns true for empty string because the scoped value is defined', () => {
    const data = { applicantContactDetails: { firstName: '' } };
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];

    expect(hasDataInScopes(data, scopes)).toBe(true);
  });

  it('returns false if all scoped data is undefined', () => {
    const data = {};
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];

    expect(hasDataInScopes(data, scopes)).toBe(false);
  });

  it('returns false when no scopes are provided', () => {
    expect(hasDataInScopes({ fullName: 'Jane' }, [])).toBe(false);
  });
});

describe('isErrorPathIncluded', () => {
  it('returns true when path exactly matches an errorPath', () => {
    expect(isErrorPathIncluded(['name'], 'name')).toBe(true);
  });

  it('returns true when path is a descendant of an errorPath', () => {
    expect(isErrorPathIncluded(['name'], 'name.firstName')).toBe(true);
    expect(isErrorPathIncluded(['name'], 'name.firstName.middle')).toBe(true);
  });

  it('returns false when path is not included by any errorPath', () => {
    expect(isErrorPathIncluded(['name'], 'other')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'names')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'nameX.firstName')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'na.me')).toBe(false);
  });

  it('handles multiple errorPaths', () => {
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'b')).toBe(true);
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'c.child')).toBe(true);
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'd.child')).toBe(false);
  });

  it('returns false when errorPaths is empty', () => {
    expect(isErrorPathIncluded([], 'name')).toBe(false);
  });
});
