import { isJson, getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage } from './util';
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
