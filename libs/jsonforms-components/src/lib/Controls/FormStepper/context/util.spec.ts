/* eslint-disable @typescript-eslint/no-explicit-any */

import { hasMeaningfulValue, hasValueAtScope, getStepStatus } from './util';
import { StepStatus } from '../../../common/Constants';

describe('hasMeaningfulValue', () => {
  test('returns false for undefined or null', () => {
    expect(hasMeaningfulValue(undefined)).toBe(false);
    expect(hasMeaningfulValue(null)).toBe(false);
  });

  test('returns false for empty string or string with only spaces', () => {
    expect(hasMeaningfulValue('')).toBe(false);
    expect(hasMeaningfulValue('   ')).toBe(false);
  });

  test('returns true for non-empty string', () => {
    expect(hasMeaningfulValue('hello')).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(hasMeaningfulValue([])).toBe(false);
  });

  test('returns true for non-empty array', () => {
    expect(hasMeaningfulValue([1, 2, 3])).toBe(true);
  });

  test('returns false for empty object', () => {
    expect(hasMeaningfulValue({})).toBe(false);
  });

  test('returns true for non-empty object', () => {
    expect(hasMeaningfulValue({ key: 'value' })).toBe(true);
  });

  test('returns true for numbers and booleans', () => {
    expect(hasMeaningfulValue(0)).toBe(true);
    expect(hasMeaningfulValue(42)).toBe(true);
    expect(hasMeaningfulValue(true)).toBe(true);
    expect(hasMeaningfulValue(false)).toBe(true);
  });
});

describe('hasValueAtScope', () => {
  test('returns false if scope cannot be normalized', () => {
    expect(hasValueAtScope({}, '')).toBe(false);
  });

  test('returns true if meaningful value exists at normalized scope', () => {
    const data = { user: { name: 'John' } };
    expect(hasValueAtScope(data, '#/user/name')).toBe(true);
  });

  test('returns false if no meaningful value exists at normalized scope', () => {
    const data = { user: { name: '' } };
    expect(hasValueAtScope(data, '#/user/name')).toBe(false);
  });
});

describe('getStepStatus', () => {
  const schema = {
    required: ['name'],
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
  };

  test('returns NOT_STARTED if no data exists in scopes', () => {
    const opts = {
      scopes: ['#/name'],
      data: {},
      errors: [],
      schema,
    };
    expect(getStepStatus(opts)).toBe(StepStatus.NOT_STARTED);
  });

  test('returns IN_PROGRESS if there are errors in the scope after step has started', () => {
    const opts = {
      scopes: ['#/name'],
      data: { name: 'John' },
      errors: [{ instancePath: '/name', message: 'must not be empty' }],
      schema,
    };
    expect(getStepStatus(opts)).toBe(StepStatus.IN_PROGRESS);
  });

  test('returns NOT_STARTED if required fields are empty and step has not started', () => {
    const opts = {
      scopes: ['#/name'],
      data: { name: '' },
      errors: [],
      schema,
    };
    expect(getStepStatus(opts)).toBe(StepStatus.NOT_STARTED);
  });

  test('returns COMPLETED if all required fields are filled and no errors exist', () => {
    const opts = {
      scopes: ['#/name'],
      data: { name: 'John' },
      errors: [],
      schema,
    };
    expect(getStepStatus(opts)).toBe(StepStatus.COMPLETED);
  });
});
