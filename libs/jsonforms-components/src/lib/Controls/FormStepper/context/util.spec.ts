import { isJson, getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage, getIncompletePaths } from './util';
import Ajv from 'ajv';
const localStorageMock = {
  store: {},
  setItem(key, value) {
    this.store[key] = String(value);
  },
  getItem(key) {
    return this.store[key] || null;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
describe('Test the stepper utilities', () => {
  global.window = Object.create(window);
  const url = 'http://localhost';
  Object.defineProperty(window, 'location', {
    value: {
      href: url,
    },
    writable: true,
  });
  beforeEach(() => {
    localStorage.clear(); // Clear local storage before each test
  });
  it('can valid json string', async () => {
    expect(isJson('test')).toBe(false);
    expect(isJson('{}')).toBe(true);
  });

  it('can valid json string', async () => {
    expect(isJson('test')).toBe(false);
    expect(isJson('{}')).toBe(true);
  });

  it('can get stored value', async () => {
    localStorage.setItem('http://localhost' + '_' + new Date().toISOString().slice(0, 10), '[true]');
    expect((getIsVisitFromLocalStorage() as boolean[])[0]).toBe(true);
    localStorage.setItem('http://localhost' + '_' + new Date().toISOString().slice(0, 10), '[tru]');
    expect(getIsVisitFromLocalStorage()).toBe(undefined);
  });

  it('can set stored value', async () => {
    saveIsVisitFromLocalStorage([true]);
  });
});
describe('getIncompletePaths', () => {
  const ajv = new Ajv();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const schema: any = {
    type: 'object',
    required: ['firstName', 'address'],
    properties: {
      firstName: {
        type: 'string',
      },
      lastName: {
        type: 'string',
      },
      address: {
        type: 'object',
        required: ['street'],
        properties: {
          street: {
            type: 'string',
            minLength: 5,
          },
          city: {
            type: 'string',
          },
        },
      },
      bio: {
        type: 'string',
        minLength: 10,
      },
    },
  };

  const scopes = ['#/properties/firstName', '#/properties/address/properties/street', '#/properties/bio'];

  it('returns empty array when all required & minLength constraints are satisfied', () => {
    const data = {
      firstName: 'Alice',
      address: {
        street: '12345 Main',
        city: 'Edmonton',
      },
      bio: 'I am more than ten chars',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).toEqual([]);
  });

  it('flags missing top-level required field', () => {
    const data = {
      address: {
        street: '12345 Main',
      },
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    // 预期：只标记 firstName
    expect(result).toContain('firstName');
    expect(result).not.toContain('address.street');
    expect(result).not.toContain('bio');
  });

  it('flags nested required field with too-short value (minLength)', () => {
    const data = {
      firstName: 'Alice',
      address: {
        street: '123',
      },
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).toContain('address.street');
    expect(result).not.toContain('firstName');
  });

  it('flags field that only violates minLength (not required)', () => {
    const data = {
      firstName: 'Alice',
      address: {
        street: '12345 Main',
      },
      bio: 'short',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).toContain('bio');
  });

  it('does not flag non-required field when missing and only minLength is defined', () => {
    const data = {
      firstName: 'Alice',
      address: {
        street: '12345 Main',
      },
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).not.toContain('bio');
  });

  it('ignores scopes that do not exist in the schema', () => {
    const badScopes = ['#/properties/doesNotExist'];

    const data = {
      firstName: 'Alice',
    };

    const result = getIncompletePaths(ajv, schema, data, badScopes);

    expect(result).toEqual([]);
  });

  it('combines multiple issues correctly', () => {
    const data = {
      address: {
        street: '12',
      },
      bio: 'tiny',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).toEqual(expect.arrayContaining(['firstName', 'address.street', 'bio']));
    expect(result.length).toBe(3);
  });
});
