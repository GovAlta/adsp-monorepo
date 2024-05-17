import '@testing-library/jest-dom';
import { getFormFieldValue, labelToString } from './GenerateFormFields';

describe('Label to string', () => {
  it('Should correctly resolve and format label from scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(labelToString(undefined, scope1)).toEqual('First name');
    expect(labelToString(undefined, scope2)).toEqual('Street');
  });

  it('returns correctly formatted string for valid scope patterns', () => {
    const validScope1 = '#/properties/firstName';
    const validScope2 = '#/properties/address/properties/city';
    expect(labelToString(undefined, validScope1)).toEqual('First name');
    expect(labelToString(undefined, validScope2)).toEqual('City');
  });

  it('returns null for scope not starting with "#"', () => {
    const invalidScope = '/properties/firstName';
    expect(labelToString(undefined, invalidScope)).toBe('');
  });

  it('returns null for scope missing "properties"', () => {
    const invalidScope = '#/firstName';
    expect(labelToString(undefined, invalidScope)).toBe('');
  });

  it('returns null for scope with incorrect "properties" spelling', () => {
    const invalidScope = '#/propertees/firstName';
    expect(labelToString(undefined, invalidScope)).toBe('');
  });

  it('returns null for invalid scope patterns', () => {
    const invalidScope1 = '#/properties/';
    const invalidScope2 = '##/properties/firstName';
    const invalidScope3 = '#/properties/first/Name';
    expect(labelToString(undefined, invalidScope1)).toBe('');
    expect(labelToString(undefined, invalidScope2)).toBe('');
    expect(labelToString(undefined, invalidScope3)).toBe('');
  });

  it('returns empty string for empty or null scope', () => {
    const emptyScope = '';
    expect(labelToString(undefined, emptyScope)).toBe('');
  });

  it('returns an empty string if the scope does not end with a valid property name', () => {
    const invalidScope = '#/properties/';
    expect(labelToString(undefined, invalidScope)).toBe('');
  });

  it('will not return a hidden label', () => {
    const label = labelToString({ show: false, text: 'tada!' }, '#/properties/firstName');
    expect(label).toBe('');
  });

  it('will return a visible label', () => {
    const label = labelToString({ show: true, text: 'tada!' }, '#/properties/firstName');
    expect(label).toBe('tada!');
  });

  it('will use scope if description text is undefined', () => {
    const label = labelToString({ show: true, text: undefined }, '#/properties/firstName');
    expect(label).toBe('First name');
  });

  it('will return a valid label', () => {
    const label = labelToString('tada!', '#/properties/firstName');
    expect(label).toBe('tada!');
  });
});

describe('getFormFieldValue', () => {
  it('will return the correct value for a scope', () => {
    const scope = '#/properties/firstName';
    const data = { firstName: 'Alex', address: { street: 'Springfield' } };
    const alex = getFormFieldValue({}, scope, data);
    expect(alex.type).toBe('primitive');
    expect(alex.value).toEqual('Alex');
  });

  it('will return the correct value for a nested scope', () => {
    const scope = '#/properties/address/properties/street';
    const data = { firstName: 'Alex', address: { street: 'Springfield' } };
    const springfield = getFormFieldValue({}, scope, data);
    expect(springfield.type).toBe('primitive');
    expect(springfield.value).toEqual('Springfield');
  });

  it('can handle an empty data object', () => {
    const scope = '#/properties/firstName';
    const empty = getFormFieldValue({}, scope, {});
    expect(empty.type).toBe('primitive');
    expect(empty.value).toBe(undefined);
  });

  it('returns the correct value for a checkbox', () => {
    const scope = '#/properties/isAlive';
    const empty = getFormFieldValue({}, scope, { isAlive: true });
    expect(empty.type).toBe('primitive');
    expect(empty.value).toBe('Yes');
  });

  it('will return empty value for the specified scope and undefined data', () => {
    const scope1 = '#/properties/secondName';
    const scope2 = '#/properties/address/properties/street';
    const data = { firstName: 'bob', address: { street: undefined } };
    const value1 = getFormFieldValue({}, scope1, data);
    expect(value1.value).toBe(undefined);
    expect(value1.type).toBe('primitive');
    const value2 = getFormFieldValue({}, scope2, data);
    expect(value2.type).toBe('primitive');
    expect(value2.value).toBe(undefined);
  });

  it('will return a value for simple objects', () => {
    const data = { name: { firstName: 'bob', lastName: 'bing' }, address: { street: 'no-name', city: 'nowhere' } };
    const name = getFormFieldValue({}, '#/properties/name', data);
    expect(name.type).toBe('object');
    expect(name.value).toEqual([
      ['firstName', 'bob'],
      ['lastName', 'bing'],
    ]);
    const address = getFormFieldValue({}, '#/properties/address', data);
    expect(address.type).toBe('object');
    expect(address.value).toEqual([
      ['street', 'no-name'],
      ['city', 'nowhere'],
    ]);
  });

  it('will return a value for nested objects', () => {
    const data = { person: { firstName: 'bob', lastName: 'bing', address: { street: 'no-name', city: 'nowhere' } } };
    const person = getFormFieldValue({}, '#/properties/person', data);
    expect(person.type).toBe('object');
    expect(person.value).toEqual([
      ['firstName', 'bob'],
      ['lastName', 'bing'],
      ['street', 'no-name'],
      ['city', 'nowhere'],
    ]);
  });

  it('will evaluate an array of objects', () => {
    const data = [
      { animal: 'skunk', color: 'black' },
      { animal: 'polar bear', color: 'white' },
    ];
    const animals = getFormFieldValue({}, '', data);
    expect(animals.type).toBe('array');
    expect(animals.value?.length).toBe(2);
    expect((animals.value as string[][])[0][1].length).toBe(2);
    expect((animals.value as string[][])[0][1][0]).toEqual(['animal', 'skunk']);
  });
});
