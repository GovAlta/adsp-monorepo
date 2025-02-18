import { getProperty, pickPropertyValues } from './helpers';

describe('getProperty', () => {
  const testObj = {
    name: 'John',
    address: {
      city: 'New York',
      zip: '10001',
    },
    contacts: {
      phone: '123-456-7890',
      email: 'john@example.com',
    },
    nested: {
      level1: {
        level2: {
          target: 'Found me!',
        },
      },
    },
  };

  it('should return the value of a direct property', () => {
    expect(getProperty(testObj, 'name')).toBe('John');
  });

  it('should return the value of a nested property', () => {
    expect(getProperty(testObj, 'city')).toBe('New York');
  });

  it('should return the value of a deeply nested property', () => {
    expect(getProperty(testObj, 'target')).toBe('Found me!');
  });

  it('should return undefined if the property does not exist', () => {
    expect(getProperty(testObj, 'nonExistent')).toBeUndefined();
  });
});

describe('pickPropertyValues', () => {
  const testObj = {
    name: 'John',
    address: {
      city: 'New York',
      zip: '10001',
    },
    contacts: {
      phone: '123-456-7890',
      email: 'john@example.com',
    },
    nested: [{ level1: 'Data1' }, { level1: 'Data2' }, { level1: { level2: 'Data3' } }],
  };

  it('should return all values of a direct property', () => {
    expect(pickPropertyValues(testObj, 'name')).toEqual(['John']);
  });

  it('should return all values of a nested property', () => {
    expect(pickPropertyValues(testObj, 'city')).toEqual(['New York']);
  });

  it('should return multiple values if the property appears more than once', () => {
    expect(pickPropertyValues(testObj, 'level1')).toEqual(['Data1', 'Data2', { level2: 'Data3' }]);
  });

  it('should return an empty array if the property does not exist', () => {
    expect(pickPropertyValues(testObj, 'nonExistent')).toEqual([]);
  });
});
