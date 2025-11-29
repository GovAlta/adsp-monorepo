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

describe('test getIncompletePaths', () => {
  const ajv = new Ajv();

  const schema = {
    type: 'object',
    properties: {
      applicantContactDetails: {
        type: 'object',
        properties: {
          applicantMailAddress: {
            type: 'object',
            properties: {
              addressLine1: { type: 'string' },
              addressLine2: { type: 'string' },
              city: { type: 'string' },
              provinceState: { type: 'string' },
              country: { type: 'string', minLength: 3 },
              postalCodeZip: { type: 'string' },
            },
            required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
          },
        },
      },

      whichOfThemApplies: {
        type: 'string',
      },
    },
    required: ['whichOfThemApplies'],
  };

  const scopes = [
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/addressLine1',
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/addressLine2',
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/city',
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/provinceState',
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/country',
    '#/properties/applicantContactDetails/properties/applicantMailAddress/properties/postalCodeZip',
  ];

  it('returns incomplete paths for missing required deep properties', () => {
    const data = {
      applicantContactDetails: {
        applicantMailAddress: {
          // addressLine1 missing
          addressLine2: 'Unit 2',
          // city missing
          provinceState: 'Alberta',
          country: 'Canada',
          // postalCodeZip missing
        },
      },
      whichOfThemApplies: 'something',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    // We expect missing required fields at deep levels
    expect(result).toEqual([
      'applicantContactDetails.applicantMailAddress.addressLine1',
      'applicantContactDetails.applicantMailAddress.city',
      'applicantContactDetails.applicantMailAddress.postalCodeZip',
    ]);
  });

  it('does not return non-required fields when empty', () => {
    const data = {
      applicantContactDetails: {
        applicantMailAddress: {
          addressLine1: '123 Main St',
          addressLine2: '', // NOT required
          city: 'Calgary',
          provinceState: 'Alberta',
          country: 'Canada',
          postalCodeZip: 'T2P 0L4',
        },
      },
      whichOfThemApplies: 'x',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    // All required deep fields are provided, so only [] expected
    expect(result).toEqual([]);
  });

  it('flags minLength violation for deep property', () => {
    const data = {
      applicantContactDetails: {
        applicantMailAddress: {
          addressLine1: '123 Main St',
          addressLine2: 'Unit 2',
          city: 'Calgary',
          provinceState: 'Alberta',
          country: 'CA',
          postalCodeZip: 'T2P 0L4',
        },
      },
      whichOfThemApplies: 'x',
    };

    const result = getIncompletePaths(ajv, schema, data, scopes);

    expect(result).toEqual(['applicantContactDetails.applicantMailAddress.country']);
  });

  it('works for root-level required property as well (sanity check)', () => {
    const rootScopes = ['#/properties/whichOfThemApplies'];

    const dataMissingRoot = {
      applicantContactDetails: {
        applicantMailAddress: {
          addressLine1: '123 Main St',
          city: 'Calgary',
          provinceState: 'Alberta',
          country: 'Canada',
          postalCodeZip: 'T2P 0L4',
        },
      },
    };

    const result = getIncompletePaths(ajv, schema, dataMissingRoot, rootScopes);

    expect(result).toEqual(['whichOfThemApplies']);
  });
});
