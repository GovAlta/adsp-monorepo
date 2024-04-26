import '@testing-library/jest-dom';
import { getFormFieldValue, resolveLabelFromScope } from './GenerateFormFields';

describe('resolveLabelFromScope', () => {
  it('Should correctly resolve and format label from scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(resolveLabelFromScope(scope1)).toEqual('First name');
    expect(resolveLabelFromScope(scope2)).toEqual('Street');
  });

  it('returns correctly formatted string for valid scope patterns', () => {
    const validScope1 = '#/properties/firstName';
    const validScope2 = '#/properties/address/properties/city';
    expect(resolveLabelFromScope(validScope1)).toEqual('First name');
    expect(resolveLabelFromScope(validScope2)).toEqual('City');
  });

  it('returns null for scope not starting with "#"', () => {
    const invalidScope = '/properties/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope missing "properties"', () => {
    const invalidScope = '#/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope with incorrect "properties" spelling', () => {
    const invalidScope = '#/propertees/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for invalid scope patterns', () => {
    const invalidScope1 = '#/properties/';
    const invalidScope2 = '##/properties/firstName';
    const invalidScope3 = '#/properties/first/Name';
    expect(resolveLabelFromScope(invalidScope1)).toBeNull();
    expect(resolveLabelFromScope(invalidScope2)).toBeNull();
    expect(resolveLabelFromScope(invalidScope3)).toBeNull();
  });

  it('returns empty string for empty or null scope', () => {
    const emptyScope = '';
    expect(resolveLabelFromScope(emptyScope)).toBeNull();
  });

  it('returns an empty string if the scope does not end with a valid property name', () => {
    const invalidScope = '#/properties/';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });
});

describe('getFormFieldValue', () => {
  it('will return the correct value for the specified scope', () => {
    const scope = '#/properties/firstName';
    const data = { firstName: 'Alex', address: { street: 'Springfield' } };
    const alex = getFormFieldValue(scope, data);
    expect(alex.type).toBe('primitive');
    expect(alex.value).toEqual('Alex');
  });

  it('will return the correct value for the specified scope', () => {
    const scope = '#/properties/address/properties/street';
    const data = { firstName: 'Alex', address: { street: 'Springfield' } };
    const springfield = getFormFieldValue(scope, data);
    expect(springfield.type).toBe('primitive');
    expect(springfield.value).toEqual('Springfield');
  });

  it('can handle an empty data object', () => {
    const scope = '#/properties/firstName';
    const empty = getFormFieldValue(scope, {});
    expect(empty.type).toBe('undefined');
    expect(empty.value).toBe(undefined);
  });

  it('will return empty value for the specified scope and undefined data', () => {
    const scope1 = '#/properties/secondName';
    const scope2 = '#/properties/address/properties/street';
    const data = { firstName: 'bob', address: { street: undefined } };
    const value1 = getFormFieldValue(scope1, data);
    expect(value1.value).toBe(undefined);
    expect(value1.type).toBe('undefined');
    const value2 = getFormFieldValue(scope2, data);
    expect(value2.type).toBe('undefined');
    expect(value2.value).toBe(undefined);
  });

  it('will return a value for simple objects', () => {
    const data = { name: { firstName: 'bob', lastName: 'bing' }, address: { street: 'no-name', city: 'nowhere' } };
    const name = getFormFieldValue('#/properties/name', data);
    expect(name.type).toBe('object');
    expect(name.value).toEqual([
      ['firstName', 'bob'],
      ['lastName', 'bing'],
    ]);
    const address = getFormFieldValue('#/properties/address', data);
    expect(address.type).toBe('object');
    expect(address.value).toEqual([
      ['street', 'no-name'],
      ['city', 'nowhere'],
    ]);
  });

  it('will return a value for nested objects', () => {
    const data = { person: { firstName: 'bob', lastName: 'bing', address: { street: 'no-name', city: 'nowhere' } } };
    const person = getFormFieldValue('#/properties/person', data);
    expect(person.type).toBe('object');
    expect(person.value).toEqual([
      ['firstName', 'bob'],
      ['lastName', 'bing'],
      ['street', 'no-name'],
      ['city', 'nowhere'],
    ]);
  });
});
