import { ErrorObject } from 'ajv';
import { VALIDATION_KEYWORDS, StepStatus } from '../../../common/Constants';
import {
  hasMeaningfulValue,
  isScopeRequired,
  hasValueAtScope,
  getStepStatus,
  isErrorPathIncluded,
  normalizeSchemaPath,
  normalizeInstancePath,
  getIncompletePaths,
  subErrorInParent,
  getErrorsInScopes,
  hasDataInScopes,
  isJson,
  saveIsVisitFromLocalStorage,
  getIsVisitFromLocalStorage,
} from './util';

describe('hasMeaningfulValue', () => {
  test('returns false for undefined', () => {
    // Arrange
    const value = undefined;

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(false);
  });

  test('returns false for null', () => {
    // Arrange
    const value = null;

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(false);
  });

  test('returns false for empty string', () => {
    // Arrange
    const value = '';

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true for non-empty string', () => {
    // Arrange
    const value = 'hello';

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false for empty array', () => {
    // Arrange
    const value = [];

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true for non-empty array', () => {
    // Arrange
    const value = [1, 2, 3];

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false for empty object', () => {
    // Arrange
    const value = {};

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true for non-empty object', () => {
    // Arrange
    const value = { key: 'value' };

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(true);
  });

  test('returns true for boolean true', () => {
    // Arrange
    const value = true;

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(true);
  });

  test('returns true for boolean false', () => {
    // Arrange
    const value = false;

    // Act
    const result = hasMeaningfulValue(value);

    // Assert
    expect(result).toBe(true);
  });
});

describe('isScopeRequired', () => {
  test('returns false when normalizedScopes is empty', () => {
    // Arrange
    const normalizedScopes: string[] = [];
    const required: string[] = ['field1', 'field2'];

    // Act
    const result = isScopeRequired(normalizedScopes, required);

    // Assert
    expect(result).toBe(false);
  });

  test('returns false when required is empty', () => {
    // Arrange
    const normalizedScopes: string[] = ['field1', 'field2'];
    const required: string[] = [];

    // Act
    const result = isScopeRequired(normalizedScopes, required);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true when at least one scope is required', () => {
    // Arrange
    const normalizedScopes: string[] = ['field1', 'field2'];
    const required: string[] = ['field2', 'field3'];

    // Act
    const result = isScopeRequired(normalizedScopes, required);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false when no scopes are required', () => {
    // Arrange
    const normalizedScopes: string[] = ['field1', 'field2'];
    const required: string[] = ['field3', 'field4'];

    // Act
    const result = isScopeRequired(normalizedScopes, required);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true when multiple scopes are required', () => {
    // Arrange
    const normalizedScopes: string[] = ['field1', 'field2', 'field3'];
    const required: string[] = ['field2', 'field3'];

    // Act
    const result = isScopeRequired(normalizedScopes, required);

    // Assert
    expect(result).toBe(true);
  });
});

describe('hasValueAtScope', () => {
  test('returns false for undefined data', () => {
    // Arrange
    const data = undefined;
    const scope = 'field1';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });

  test('returns false for null data', () => {
    // Arrange
    const data = null;
    const scope = 'field1';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });

  test('returns false for empty scope', () => {
    // Arrange
    const data = { field1: 'value1' };
    const scope = '';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true for existing value at scope', () => {
    // Arrange
    const data = { field1: 'value1' };
    const scope = '#/field1';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false for non-existing value at scope', () => {
    // Arrange
    const data = { field1: 'value1' };
    const scope = 'field2';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true for nested value at scope', () => {
    // Arrange
    const data = { field1: { nestedField: 'value' } };
    const scope = '#/field1/nestedField';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false for missing nested value at scope', () => {
    // Arrange
    const data = { field1: { nestedField: 'value' } };
    const scope = 'field1.missingField';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });
});

describe('getStepStatus', () => {
  test('returns NOT_STARTED when step has no required fields and no data', () => {
    // Arrange
    const opts = {
      scopes: ['#/name'],
      data: {},
      errors: [] as ErrorObject[],
      schema: {},
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.NOT_STARTED);
    expect(result.hasRequiredFields).toBe(false);
  });

  test('returns COMPLETED when step has no required fields and has been visited', () => {
    // Arrange
    const opts = {
      scopes: ['#/optional'],
      data: {},
      errors: [] as ErrorObject[],
      schema: {},
      visited: true,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.COMPLETED);
    expect(result.hasRequiredFields).toBe(false);
  });

  test('returns IN_PROGRESS when there are validation errors within the step scope', () => {
    // Arrange
    const schema = { required: ['name'], properties: { name: { type: 'string' } } };
    const opts = {
      scopes: ['#/name'],
      data: { name: 'Bob' },
      errors: [{ instancePath: '/name', message: 'invalid' }] as unknown as ErrorObject[],
      schema,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.IN_PROGRESS);
    expect(result.hasRequiredFields).toBe(true);
  });

  test('returns IN_PROGRESS when a required field is empty', () => {
    // Arrange
    const schema = {
      required: ['name'],
      properties: { name: { type: 'string' }, other: { type: 'string' } },
    };
    const opts = {
      scopes: ['#/name', '#/other'],
      data: { name: '', other: 'x' },
      errors: [] as ErrorObject[],
      schema,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.IN_PROGRESS);
    expect(result.hasRequiredFields).toBe(true);
  });

  test('returns COMPLETED when all required fields are filled and there are no conditional dependents', () => {
    // Arrange
    const schema = { required: ['name'], properties: { name: { type: 'string' } } };
    const opts = {
      scopes: ['#/name'],
      data: { name: 'Bob' },
      errors: [] as ErrorObject[],
      schema,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.COMPLETED);
    expect(result.hasRequiredFields).toBe(true);
  });

  test('returns COMPLETED when conditional dependents exist but have no errors', () => {
    // Arrange
    const schema = {
      required: ['hasPet'],
      if: { properties: { hasPet: { const: true } } },
      then: { required: ['petName'] },
      properties: { hasPet: { type: 'boolean' }, petName: { type: 'string' } },
    };
    const opts = {
      scopes: ['#/hasPet'],
      data: { hasPet: true },
      errors: [] as ErrorObject[],
      schema,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.COMPLETED);
  });

  test('returns IN_PROGRESS when a conditional dependent field has an error', () => {
    // Arrange
    const schema = {
      required: ['hasPet'],
      if: { properties: { hasPet: { const: true } } },
      then: { required: ['petName'] },
      properties: { hasPet: { type: 'boolean' }, petName: { type: 'string' } },
    };
    const opts = {
      scopes: ['#/hasPet'],
      data: { hasPet: true },
      errors: [
        {
          instancePath: '/petName',
          keyword: VALIDATION_KEYWORDS.REQUIRED,
          params: { missingProperty: 'petName' },
          message: 'is a required property',
        },
      ] as unknown as ErrorObject[],
      schema,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.IN_PROGRESS);
  });

  test('falls back to the visited flag when scopes cannot be normalized', () => {
    // Arrange
    const opts = {
      scopes: ['not-a-schema-path'],
      data: {},
      errors: [] as ErrorObject[],
      schema: {},
      visited: true,
    };

    // Act
    const result = getStepStatus(opts);

    // Assert
    expect(result.status).toBe(StepStatus.COMPLETED);
  });
});

describe('isErrorPathIncluded', () => {
  test('returns true for an exact path match', () => {
    // Arrange
    const errorPaths = ['name'];

    // Act
    const result = isErrorPathIncluded(errorPaths, 'name');

    // Assert
    expect(result).toBe(true);
  });

  test('returns true for a nested path match', () => {
    // Arrange
    const errorPaths = ['name'];

    // Act
    const result = isErrorPathIncluded(errorPaths, 'name.firstName');

    // Assert
    expect(result).toBe(true);
  });

  test('returns false when no error path matches', () => {
    // Arrange
    const errorPaths = ['address'];

    // Act
    const result = isErrorPathIncluded(errorPaths, 'name');

    // Assert
    expect(result).toBe(false);
  });
});

describe('normalizeSchemaPath', () => {
  test('returns empty string for a path that does not start with #/', () => {
    // Arrange & Act
    const result = normalizeSchemaPath('name');

    // Assert
    expect(result).toBe('');
  });

  test('converts a schema path to dot notation and strips properties segments', () => {
    // Arrange & Act
    const result = normalizeSchemaPath('#/properties/name/properties/firstName');

    // Assert
    expect(result).toBe('name.firstName');
  });
});

describe('normalizeInstancePath', () => {
  test('returns empty string for an empty instance path', () => {
    // Arrange & Act
    const result = normalizeInstancePath('');

    // Assert
    expect(result).toBe('');
  });

  test('converts an instance path to dot notation and drops array indices', () => {
    // Arrange & Act
    const result = normalizeInstancePath('/roadmap/0/when');

    // Assert
    expect(result).toBe('roadmap.when');
  });
});

describe('getIncompletePaths', () => {
  test('returns an empty array when there are no errors', () => {
    // Arrange & Act
    const result = getIncompletePaths(undefined, ['#/name']);

    // Assert
    expect(result).toEqual([]);
  });

  test('matches a required error against the scoped path', () => {
    // Arrange
    const errors = [
      {
        instancePath: '',
        keyword: VALIDATION_KEYWORDS.REQUIRED,
        params: { missingProperty: 'name' },
      },
    ] as unknown as ErrorObject[];

    // Act
    const result = getIncompletePaths(errors, ['#/name']);

    // Assert
    expect(result).toEqual(['name']);
  });

  test('matches a non-required error against the scoped path via instancePath', () => {
    // Arrange
    const errors = [{ instancePath: '/name', keyword: 'minLength' }] as unknown as ErrorObject[];

    // Act
    const result = getIncompletePaths(errors, ['#/name']);

    // Assert
    expect(result).toEqual(['name']);
  });

  test('ignores errors that do not fall within any scoped path', () => {
    // Arrange
    const errors = [{ instancePath: '/address', keyword: 'minLength' }] as unknown as ErrorObject[];

    // Act
    const result = getIncompletePaths(errors, ['#/name']);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('subErrorInParent', () => {
  test('returns false when the instance path has fewer than two segments', () => {
    // Arrange
    const error = { instancePath: '/roadmap' } as ErrorObject;

    // Act
    const result = subErrorInParent(error, ['roadmap']);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true when the array item path matches a parent path', () => {
    // Arrange
    const error = { instancePath: '/roadmap/0' } as ErrorObject;

    // Act
    const result = subErrorInParent(error, ['/roadmap']);

    // Assert
    expect(result).toBe(true);
  });

  test('returns true when a nested array item property path matches a parent path', () => {
    // Arrange
    const error = { instancePath: '/roadmap/0/when' } as ErrorObject;

    // Act
    const result = subErrorInParent(error, ['/roadmap']);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false when neither pattern matches', () => {
    // Arrange
    const error = { instancePath: '/roadmap/when' } as ErrorObject;

    // Act
    const result = subErrorInParent(error, ['/other']);

    // Assert
    expect(result).toBe(false);
  });
});

describe('getErrorsInScopes', () => {
  test('returns an empty array when there are no errors', () => {
    // Arrange & Act
    const result = getErrorsInScopes(undefined, ['#/properties/name']);

    // Assert
    expect(result).toEqual([]);
  });

  test('returns an empty array when there are no scopes', () => {
    // Arrange
    const errors = [{ instancePath: '/name' }] as unknown as ErrorObject[];

    // Act
    const result = getErrorsInScopes(errors, []);

    // Assert
    expect(result).toEqual([]);
  });

  test('includes a required error whose missing property matches a scope', () => {
    // Arrange
    const errors = [
      {
        instancePath: '',
        keyword: VALIDATION_KEYWORDS.REQUIRED,
        params: { missingProperty: 'name' },
      },
    ] as unknown as ErrorObject[];

    // Act
    const result = getErrorsInScopes(errors, ['#/properties/name']);

    // Assert
    expect(result).toEqual(errors);
  });

  test('excludes errors whose path does not match any scope', () => {
    // Arrange
    const errors = [{ instancePath: '/address' }] as unknown as ErrorObject[];

    // Act
    const result = getErrorsInScopes(errors, ['#/properties/name']);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('hasDataInScopes', () => {
  test('returns true when at least one scope has data', () => {
    // Arrange
    const data = { name: 'Bob' };
    const scopes = ['#/properties/name'];

    // Act
    const result = hasDataInScopes(data, scopes);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false when no scopes have data', () => {
    // Arrange
    const data = {};
    const scopes = ['#/properties/name'];

    // Act
    const result = hasDataInScopes(data, scopes);

    // Assert
    expect(result).toBe(false);
  });
});

describe('isJson', () => {
  test('returns true for a valid JSON string', () => {
    // Arrange & Act
    const result = isJson('{"key":"value"}');

    // Assert
    expect(result).toBe(true);
  });

  test('returns false for an invalid JSON string', () => {
    // Arrange & Act
    const result = isJson('not-json');

    // Assert
    expect(result).toBe(false);
  });
});

describe('saveIsVisitFromLocalStorage / getIsVisitFromLocalStorage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  test('round-trips visited status through localStorage', () => {
    // Arrange
    const status = [true, false, true];

    // Act
    saveIsVisitFromLocalStorage(status);
    const result = getIsVisitFromLocalStorage();

    // Assert
    expect(result).toEqual(status);
  });

  test('returns undefined when nothing has been saved', () => {
    // Arrange & Act
    const result = getIsVisitFromLocalStorage();

    // Assert
    expect(result).toBeUndefined();
  });
});
