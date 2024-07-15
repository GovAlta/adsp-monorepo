import { getCircularReplacer } from './utils';

describe('getCircularReplacer', () => {
  it('should return the value for non-object values', () => {
    const replacer = getCircularReplacer();

    expect(replacer('key', 42)).toBe(42);
    expect(replacer('key', 'value')).toBe('value');
    expect(replacer('key', null)).toBeNull();
    expect(replacer('key', undefined)).toBeUndefined();
  });

  it('should return the object for non-circular objects', () => {
    const replacer = getCircularReplacer();
    const obj = { a: 1, b: 2 };

    expect(replacer('key', obj)).toBe(obj);
  });

  it('should handle circular references by returning undefined', () => {
    const replacer = getCircularReplacer();
    //eslint-disable-next-line
    const obj: any = { a: 1 };
    obj.b = obj;

    expect(replacer('key', obj)).toBe(obj);
    expect(replacer('key', obj.b)).toBeUndefined();
  });

  it('should work correctly with nested circular references', () => {
    const replacer = getCircularReplacer();
    //eslint-disable-next-line
    const obj: any = { a: 1, b: {} };
    obj.b.c = obj;

    expect(replacer('key', obj)).toBe(obj);
    expect(replacer('b', obj.b)).toBe(obj.b);
    expect(replacer('c', obj.b.c)).toBeUndefined();
  });

  it('should handle multiple objects without circular references correctly', () => {
    const replacer = getCircularReplacer();
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };

    expect(replacer('key1', obj1)).toBe(obj1);
    expect(replacer('key2', obj2)).toBe(obj2);
  });

  it('should handle a mix of objects with and without circular references', () => {
    const replacer = getCircularReplacer();
    const obj1 = { a: 1 };
    //eslint-disable-next-line
    const obj2: any = { b: 2 };
    obj2.c = obj2;

    expect(replacer('key1', obj1)).toBe(obj1);
    expect(replacer('key2', obj2)).toBe(obj2);
    expect(replacer('c', obj2.c)).toBeUndefined();
  });
});
