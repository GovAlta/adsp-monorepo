import { isJson } from './util';
import { buildConditionalDeps } from '../util/conditionalDeps';
import {
  getStepStatus,
  getIncompletePaths,
  normalizeSchemaPath,
  normalizeInstancePath,
  getErrorsInScopes,
  subErrorInParent,
  hasDataInScopes,
  saveIsVisitFromLocalStorage,
  getIsVisitFromLocalStorage,
  isErrorPathIncluded,
} from './util';
import type { ErrorObject } from 'ajv';

const localStorageMock = {
  store: {},
  setItem(key, value) {
    this.store[key] = String(value);
  },
  getItem(key) {
    return this.store[key] || null;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
describe('Test the stepper utilities', () => {
  global.window = Object.create(window);
  const url = 'http://localhost';
  Object.defineProperty(window, 'location', {
    value: {
      href: url,
    },
    writable: true,
  });
  beforeEach(() => {
    localStorage.clear(); // Clear local storage before each test
  });
  it('can valid json string', async () => {
    expect(isJson('test')).toBe(false);
    expect(isJson('{}')).toBe(true);
  });

  it('can valid json string', async () => {
    expect(isJson('test')).toBe(false);
    expect(isJson('{}')).toBe(true);
  });

  it('can get stored value', async () => {
    localStorage.setItem(`http://localhost_${new Date().toISOString().slice(0, 10)}`, '[true]');
    expect((getIsVisitFromLocalStorage() as boolean[])[0]).toBe(true);
    localStorage.setItem(`http://localhost_${new Date().toISOString().slice(0, 10)}`, '[tru]');
    expect(getIsVisitFromLocalStorage()).toBe(undefined);
  });

  it('can set stored value', async () => {
    saveIsVisitFromLocalStorage([true]);
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../util/conditionalDeps', () => ({
  buildConditionalDeps: jest.fn(),
}));

type AjvError = ErrorObject & { dataPath?: string };

function requiredErr(instancePath: string, missingProperty: string, schemaPath = '#/required'): AjvError {
  return {
    keyword: 'required',
    instancePath,
    schemaPath,
    params: { missingProperty },
    message: `must have required property '${missingProperty}'`,
  } as any;
}

function errorMessageErr(instancePath: string, schemaPath: string, message: string): AjvError {
  return {
    keyword: 'errorMessage',
    instancePath,
    schemaPath,
    params: {},
    message,
  } as any;
}

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
});

describe('normalizeInstancePath', () => {
  it('converts /a/b/c to a.b.c', () => {
    expect(normalizeInstancePath('/a/b/c')).toBe('a.b.c');
  });

  it('drops numeric indices: /roadmap/0/when => roadmap.when', () => {
    expect(normalizeInstancePath('/roadmap/0/when')).toBe('roadmap.when');
  });

  it('empty input => empty', () => {
    expect(normalizeInstancePath('')).toBe('');
  });
});

describe('getIncompletePaths', () => {
  it('returns [] when no errors', () => {
    expect(getIncompletePaths([], ['#/properties/a'])).toEqual([]);
    expect(getIncompletePaths(null, ['#/properties/a'])).toEqual([]);
    expect(getIncompletePaths(undefined, ['#/properties/a'])).toEqual([]);
  });

  it('matches required error to exact scope (nested)', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('/applicantContactDetails', 'firstName')];

    expect(getIncompletePaths(errors, scopes)).toEqual(['applicantContactDetails.firstName']);
  });

  it('matches required error on parent object to child scope (parent missing)', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('', 'applicantContactDetails')];

    // candidate = applicantContactDetails, scope startsWith "applicantContactDetails."
    expect(getIncompletePaths(errors, scopes)).toEqual(['applicantContactDetails.firstName']);
  });

  it('matches non-required instancePath errors inside scope', () => {
    const scopes = ['#/properties/whichOfThemApplies'];
    const errors: AjvError[] = [
      errorMessageErr(
        '/whichOfThemApplies',
        '#/properties/whichOfThemApplies/errorMessage',
        'Choose all that apply is required'
      ),
    ];

    expect(getIncompletePaths(errors, scopes)).toEqual(['whichOfThemApplies']);
  });
});

describe('getStepStatus (with mocked conditional deps)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns InProgress when incomplete fields exist in this step scopes', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const scopes = ['#/properties/whichOfThemApplies'];
    const errors: AjvError[] = [
      errorMessageErr('/whichOfThemApplies', '#/properties/whichOfThemApplies/errorMessage', 'required'),
    ];

    const status = getStepStatus({ scopes, data: {}, errors, schema: {} });
    expect(status).toBe('InProgress');
  });

  it('returns Completed when no errors in step AND no controllers in step', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(new Map());

    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const status = getStepStatus({ scopes, data: {}, errors: [], schema: {} });
    expect(status).toBe('Completed');
  });

  it('returns InProgress when step contains a controller that triggers missing required in affected path', () => {
    // controller: fillingApplicationOnbehalf
    // affected: applicantContactDetails
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]])
    );

    const scopes = ['#/properties/fillingApplicationOnbehalf'];

    // error is outside this step scope, but is under affectedPaths => should make controller step InProgress
    const errors: AjvError[] = [requiredErr('', 'applicantContactDetails', '#/allOf/0/then/required')];

    const status = getStepStatus({ scopes, data: { fillingApplicationOnbehalf: 'No' }, errors, schema: {} });
    expect(status).toBe('InProgress');
  });

  it('returns Completed when controller step has no affected-path errors', () => {
    (buildConditionalDeps as jest.Mock).mockReturnValue(
      new Map<string, string[]>([['fillingApplicationOnbehalf', ['applicantContactDetails']]])
    );

    const scopes = ['#/properties/fillingApplicationOnbehalf'];
    const errors: AjvError[] = [
      // unrelated error
      errorMessageErr('/whichOfThemApplies', '#/properties/whichOfThemApplies/errorMessage', 'required'),
    ];

    const status = getStepStatus({ scopes, data: { fillingApplicationOnbehalf: 'No' }, errors, schema: {} });
    expect(status).toBe('Completed');
  });
});

describe('getErrorsInScopes', () => {
  it('filters required error to matching scope path', () => {
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    const errors: AjvError[] = [requiredErr('/applicantContactDetails', 'firstName')];

    const result = getErrorsInScopes(errors as any, scopes);
    expect(result.length).toBe(1);
    expect(result[0].keyword).toBe('required');
  });

  it('filters non-required error to matching scope path', () => {
    const scopes = ['#/properties/whichOfThemApplies'];
    const errors: AjvError[] = [
      errorMessageErr('/whichOfThemApplies', '#/properties/whichOfThemApplies/errorMessage', 'required'),
    ];

    const result = getErrorsInScopes(errors as any, scopes);
    expect(result.length).toBe(1);
    expect(result[0].keyword).toBe('errorMessage');
  });

  it('returns [] if no scopes or errors', () => {
    expect(getErrorsInScopes([], [])).toEqual([]);
    expect(getErrorsInScopes(undefined, ['#/properties/a'])).toEqual([]);
  });
});

describe('subErrorInParent', () => {
  it('detects /roadmap/0 belongs to /roadmap', () => {
    const err = { instancePath: '/roadmap/0', keyword: 'required', schemaPath: '#/required', params: {} } as any;
    expect(subErrorInParent(err, ['/roadmap'])).toBe(true);
  });

  it('detects /roadmap/0/when belongs to /roadmap', () => {
    const err = { instancePath: '/roadmap/0/when', keyword: 'required', schemaPath: '#/required', params: {} } as any;
    expect(subErrorInParent(err, ['/roadmap'])).toBe(true);
  });

  it('returns false when not array-index pattern', () => {
    const err = { instancePath: '/roadmap/when', keyword: 'required', schemaPath: '#/required', params: {} } as any;
    expect(subErrorInParent(err, ['/roadmap'])).toBe(false);
  });
});

describe('hasDataInScopes', () => {
  it('returns true if any scope has data', () => {
    const data = { applicantContactDetails: { firstName: 'A' } };
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    expect(hasDataInScopes(data as any, scopes)).toBe(true);
  });

  it('returns false if all scoped data undefined', () => {
    const data = {};
    const scopes = ['#/properties/applicantContactDetails/properties/firstName'];
    expect(hasDataInScopes(data as any, scopes)).toBe(false);
  });
});

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveIsVisitFromLocalStorage + getIsVisitFromLocalStorage roundtrip', () => {
    const val = [true, false, true];
    saveIsVisitFromLocalStorage(val);

    const restored = getIsVisitFromLocalStorage();
    expect(restored).toEqual(val);
  });

  it('getIsVisitFromLocalStorage returns undefined if missing or invalid', () => {
    const restored = getIsVisitFromLocalStorage();
    expect(restored).toBeUndefined();
  });
});

describe('isErrorPathIncluded', () => {
  it('returns true when path exactly matches an errorPath (case A)', () => {
    expect(isErrorPathIncluded(['name'], 'name')).toBe(true);
  });

  it('returns true when path is a descendant of an errorPath (case B)', () => {
    expect(isErrorPathIncluded(['name'], 'name.firstName')).toBe(true);
    expect(isErrorPathIncluded(['name'], 'name.firstName.middle')).toBe(true);
  });

  it('returns false when path is not included by any errorPath', () => {
    expect(isErrorPathIncluded(['name'], 'other')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'names')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'nameX.firstName')).toBe(false);
    expect(isErrorPathIncluded(['name'], 'na.me')).toBe(false);
  });

  it('handles multiple errorPaths (any match makes it true)', () => {
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'b')).toBe(true);
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'c.child')).toBe(true);
    expect(isErrorPathIncluded(['a', 'b', 'c'], 'd.child')).toBe(false);
  });

  it('does not treat similar prefixes as included (must be dot-boundary)', () => {
    expect(isErrorPathIncluded(['name'], 'name2.first')).toBe(false);

    expect(isErrorPathIncluded(['name'], 'names.first')).toBe(false);
  });

  it('returns false when errorPaths is empty', () => {
    expect(isErrorPathIncluded([], 'name')).toBe(false);
  });

  it('supports nested errorPath matching deeper descendants', () => {
    expect(isErrorPathIncluded(['a.b'], 'a.b')).toBe(true);
    expect(isErrorPathIncluded(['a.b'], 'a.b.c')).toBe(true);
    expect(isErrorPathIncluded(['a.b'], 'a.bc')).toBe(false);
    expect(isErrorPathIncluded(['a.b'], 'a.bx.c')).toBe(false);
  });

  it('treats empty string errorPath as matching any non-empty path that starts with "." (current behavior)', () => {
    expect(isErrorPathIncluded([''], '')).toBe(true);
    expect(isErrorPathIncluded([''], 'name')).toBe(false);
    expect(isErrorPathIncluded([''], 'name.first')).toBe(false);
  });
});
