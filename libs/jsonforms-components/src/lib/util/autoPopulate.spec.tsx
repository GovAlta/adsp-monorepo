import { USER_FIELD_DEFINITIONS, autoPopulateValue, autoPopulatePropertiesMonaco } from './autoPopulate';

import { User } from '../Context/register';

describe('User field definitions', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roles: [],
    preferredUsername: 'jdoe',
  };

  test('USER_FIELD_DEFINITIONS contains all expected keys', () => {
    const defs = USER_FIELD_DEFINITIONS;

    expect(defs).toHaveProperty('fullName');
    expect(defs).toHaveProperty('name');
    expect(defs).toHaveProperty('firstName');
    expect(defs).toHaveProperty('lastName');
    expect(defs).toHaveProperty('userName');
    expect(defs).toHaveProperty('email');
  });

  test('fullName returns full name', () => {
    const value = autoPopulateValue(mockUser, { path: 'fullName' });
    expect(value).toBe('John Doe');
  });

  test('name returns full name', () => {
    const value = autoPopulateValue(mockUser, { path: 'name' });
    expect(value).toBe('John Doe');
  });

  test('firstName extracts first name', () => {
    const value = autoPopulateValue(mockUser, { path: 'firstName' });
    expect(value).toBe('John');
  });

  test('lastName extracts last name', () => {
    const value = autoPopulateValue(mockUser, { path: 'lastName' });
    expect(value).toBe('Doe');
  });

  test('userName uses preferredUsername when available', () => {
    const value = autoPopulateValue(mockUser, { path: 'userName' });
    expect(value).toBe('jdoe');
  });

  test('userName falls back to email', () => {
    const userNoPreferred: User = {
      ...mockUser,
      preferredUsername: '',
    };

    const value = autoPopulateValue(userNoPreferred, { path: 'userName' });
    expect(value).toBe('john@example.com');
  });

  test('email returns user email', () => {
    const value = autoPopulateValue(mockUser, { path: 'email' });
    expect(value).toBe('john@example.com');
  });

  test('returns undefined for unknown field', () => {
    const value = autoPopulateValue(mockUser, { path: 'unknownField' });
    expect(value).toBeUndefined();
  });

  test('handles missing last name gracefully', () => {
    const singleNameUser: User = {
      ...mockUser,
      name: 'John',
    };

    const lastName = autoPopulateValue(singleNameUser, { path: 'lastName' });

    expect(lastName).toBe('');
  });
});

describe('Monaco autocomplete', () => {
  test('autoPopulatePropertiesMonaco returns label and insertText', () => {
    const props = autoPopulatePropertiesMonaco;

    expect(props.length).toBeGreaterThan(0);

    props.forEach((prop) => {
      expect(prop).toHaveProperty('label');
      expect(prop).toHaveProperty('insertText');
    });
  });

  test('Monaco list contains email field', () => {
    const emailEntry = autoPopulatePropertiesMonaco.find((p) => p.label.includes('email'));

    expect(emailEntry).toBeDefined();
  });
});
