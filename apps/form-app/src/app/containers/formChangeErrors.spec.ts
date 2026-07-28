import { resolveFormChangeErrors } from './formChangeErrors';
import { ValidationError } from '../state';

const error = (overrides: Partial<ValidationError>): ValidationError =>
  ({
    instancePath: '/field',
    keyword: 'enum',
    message: 'should be equal to one of the allowed values',
    params: {},
    schemaPath: '#/properties/field/enum',
    ...overrides,
  }) as ValidationError;

describe('resolveFormChangeErrors', () => {
  it('tolerates undefined errors', () => {
    // Regression guard: DraftForm's auto-populate effect calls onChange with data only. Indexing
    // errors unguarded threw "Cannot read properties of undefined (reading '0')", which unmounted
    // the form to a blank page on load and again whenever an auto-populated value was cleared.
    expect(() => resolveFormChangeErrors(undefined)).not.toThrow();
    expect(resolveFormChangeErrors(undefined)).toBeUndefined();
  });

  it('passes an empty error list through', () => {
    expect(resolveFormChangeErrors([])).toEqual([]);
  });

  it('discards the allowed-values error raised against a runtime populated enum', () => {
    expect(resolveFormChangeErrors([error({})])).toBeNull();
  });

  it('keeps an allowed-values error that is not against an enum', () => {
    const errors = [error({ schemaPath: '#/properties/field/const' })];

    expect(resolveFormChangeErrors(errors)).toBe(errors);
  });

  it('keeps an enum error with a different message', () => {
    const errors = [error({ message: 'should be string' })];

    expect(resolveFormChangeErrors(errors)).toBe(errors);
  });

  it('tolerates an error with no schemaPath', () => {
    const errors = [error({ schemaPath: undefined })];

    expect(() => resolveFormChangeErrors(errors)).not.toThrow();
    expect(resolveFormChangeErrors(errors)).toBe(errors);
  });
});
