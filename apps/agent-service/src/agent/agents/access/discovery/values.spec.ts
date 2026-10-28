import {
  asRecord,
  attributeBoolean,
  attributeNumber,
  attributeString,
  displayText,
  isRecord,
  optionalBoolean,
  optionalString,
  recordList,
  stringList,
} from './values';

describe('values', () => {
  it('reads strings and booleans only when they have the expected type', () => {
    expect(optionalString('client')).toBe('client');
    expect(optionalString(1)).toBeUndefined();
    expect(optionalBoolean(false)).toBe(false);
    expect(optionalBoolean('true')).toBeUndefined();
  });

  it('keeps only the string items of a list', () => {
    expect(stringList(['a', 1, null, 'b'])).toEqual(['a', 'b']);
    expect(stringList('a')).toEqual([]);
  });

  it('recognizes plain objects as records', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord('text')).toEqual({});
    expect(recordList([{ a: 1 }, 'b', null, [1]])).toEqual([{ a: 1 }]);
    expect(recordList(undefined)).toEqual([]);
  });

  it('treats an empty Keycloak setting as not set', () => {
    expect(attributeString('S256')).toBe('S256');
    expect(attributeString('')).toBeUndefined();
    expect(attributeString('  ')).toBeUndefined();
    expect(attributeString(true)).toBeUndefined();
  });

  it('treats a Keycloak localization key as no display text', () => {
    expect(displayText('Demo web app')).toBe('Demo web app');
    expect(displayText('${client_account}')).toBeUndefined();
    expect(displayText(' ${role_view-clients} ')).toBeUndefined();
    expect(displayText('Uses ${placeholder} inside text')).toBe('Uses ${placeholder} inside text');
    expect(displayText('')).toBeUndefined();
  });

  it('reads Keycloak boolean settings stored as strings', () => {
    expect(attributeBoolean('true')).toBe(true);
    expect(attributeBoolean('false')).toBe(false);
    expect(attributeBoolean('')).toBeUndefined();
    expect(attributeBoolean(true)).toBeUndefined();
  });

  it('reads Keycloak numeric settings stored as strings', () => {
    expect(attributeNumber('300')).toBe(300);
    expect(attributeNumber('-1')).toBe(-1);
    expect(attributeNumber('')).toBeUndefined();
    expect(attributeNumber('soon')).toBeUndefined();
    expect(attributeNumber(300)).toBeUndefined();
  });
});
