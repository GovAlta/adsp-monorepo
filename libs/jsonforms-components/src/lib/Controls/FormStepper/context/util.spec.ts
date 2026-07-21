import { hasMeaningfulValue, isScopeRequired, hasValueAtScope } from './util';

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
});

describe('hasValueAtScope', () => {
  test('returns false when path is invalid', () => {
    // Arrange
    const data = { field1: 'value1' };
    const scope = 'invalid.path';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });

  test('returns true when value at scope is meaningful', () => {
    // Arrange
    const data = { field1: 'value1' };
    const scope = '#/field1';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(true);
  });

  test('returns false when value at scope is not meaningful', () => {
    // Arrange
    const data = { field1: '' };
    const scope = '#/field1';

    // Act
    const result = hasValueAtScope(data, scope);

    // Assert
    expect(result).toBe(false);
  });
});