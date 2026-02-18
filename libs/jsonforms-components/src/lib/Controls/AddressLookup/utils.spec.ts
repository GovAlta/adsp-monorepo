import {
  fetchAddressSuggestions,
  filterAlbertaAddresses,
  mapSuggestionToAddress,
  filterSuggestionsWithoutAddressCount,
  validatePostalCode,
  handlePostalCodeValidation,
  formatPostalCode,
  detectPostalCodeType,
  formatPostalCodeIfNeeded,
  handleAddressKeyDown,
  runAddressLookupEffect,
  normalizeQuery,
  shouldReset,
} from './utils';

import { Suggestion, Address } from './types';
jest.mock('axios');

const mockSuggestions: Suggestion[] = [
  {
    Id: 'CA|CP|A|10010614',
    Text: '1234 Example St',
    Highlight: '1-2',
    Cursor: 0,
    Description: 'Edmonton, AB, T5J 2N9',
    Next: 'Retrieve',
  },
  {
    Id: 'CA|CP|A|10010615',
    Text: '5678 Sample St',
    Highlight: '1-2',
    Cursor: 0,
    Description: 'Vancouver, BC, V6B 1L6',
    Next: 'Retrieve',
  },
];
describe('fetchAddressSuggestions', () => {
  const baseUrl = 'https://example.com';
  const formUrl = `${baseUrl}/api/gateway/v1/address/v1/find`;

  const sample: Suggestion = {
    // add minimal fields your Suggestion type requires
    // If your type is different, adjust this object
    Text: '123 Main St',
    Description: 'Calgary AB',
  } as unknown as Suggestion;
  // eslint-disable-next-line
  const makeFetchResponse = (ok: boolean, status: number, jsonValue: any) => {
    return {
      ok,
      status,
      json: jest.fn().mockResolvedValue(jsonValue),
      // eslint-disable-next-line
    } as any;
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('builds the correct URL query params (isAlberta=true -> maxSuggestions=50)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, [sample]));

    await fetchAddressSuggestions(formUrl, 'abc', true);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [calledUrl, options] = (global.fetch as jest.Mock).mock.calls[0];

    expect(typeof calledUrl).toBe('string');
    const url = new URL(calledUrl);

    expect(url.origin).toBe(baseUrl);
    expect(url.pathname).toBe('/api/gateway/v1/address/v1/find');

    expect(url.searchParams.get('searchTerm')).toBe('abc');
    expect(url.searchParams.get('languagePreference')).toBe('en');
    expect(url.searchParams.get('lastId')).toBe('');
    expect(url.searchParams.get('maxSuggestions')).toBe('50');
    expect(url.searchParams.get('country')).toBe('CAN');

    // signal not provided in this call
    expect(options).toEqual({ signal: undefined });
  });

  it('builds the correct URL query params (isAlberta=false -> maxSuggestions=10)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, [sample]));

    await fetchAddressSuggestions(formUrl, 'abc', false);

    const [calledUrl] = (global.fetch as jest.Mock).mock.calls[0];
    const url = new URL(calledUrl);

    expect(url.searchParams.get('maxSuggestions')).toBe('10');
  });

  it('passes AbortSignal to fetch when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, [sample]));

    const controller = new AbortController();
    await fetchAddressSuggestions(formUrl, 'abc', true, { signal: controller.signal });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it('throws error when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(false, 500, { anything: true }));

    await expect(fetchAddressSuggestions(formUrl, 'abc', true)).rejects.toThrow('HTTP 500');
  });

  it('returns [] if json is null/undefined', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, null));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([]);
  });

  it('returns array directly when json is an array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, [sample]));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([sample]);
  });

  it('returns json.suggestions when present', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, { suggestions: [sample] }));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([sample]);
  });

  it('returns json.items when present', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, { items: [sample] }));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([sample]);
  });

  it('returns json.Items when present', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, { Items: [sample] }));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([sample]);
  });

  it('returns [] when json is an object with no matching array keys', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeFetchResponse(true, 200, { foo: 'bar' }));

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([]);
  });

  it('prefers candidateKeys order: suggestions -> items -> Items', async () => {
    // eslint-disable-next-line
    const other: Suggestion = { Text: 'X', Description: 'Y' } as any;

    (global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse(true, 200, { items: [other], suggestions: [sample], Items: [other] })
    );

    const result = await fetchAddressSuggestions(formUrl, 'abc', true);
    expect(result).toEqual([sample]); // because 'suggestions' is checked first
  });
});
describe('filterAlbertaAddresses', () => {
  it('should filter out non-Alberta addresses', () => {
    const result = filterAlbertaAddresses(mockSuggestions);
    expect(result).toHaveLength(1);
    expect(result[0].Description).toContain('AB');
  });
});

describe('mapSuggestionToAddress', () => {
  it('should map a suggestion to an address object', () => {
    const suggestion: Suggestion = {
      Id: 'CA|CP|A|10010614',
      Text: '1234 Example St',
      Highlight: '1-2',
      Cursor: 0,
      Description: 'Edmonton, AB, T5J 2N9',
      Next: 'Retrieve',
    };

    const expectedAddress: Address = {
      addressLine1: '1234 Example St',
      addressLine2: '',
      municipality: 'Edmonton',
      subdivisionCode: 'AB',
      postalCode: 'T5J 2N9',
      country: 'CA',
    };

    const result = mapSuggestionToAddress(suggestion);
    expect(result).toEqual(expectedAddress);
  });
  it('should map the suggestion to address when suite information is present', () => {
    const suggestion: Suggestion = {
      Id: 'CA|CP|A|10010614',
      Text: 'Suite-636 20 St S',
      Highlight: '1-3',
      Cursor: 0,
      Description: 'Calgary, AB, T3H 2V4',
      Next: 'Retrieve',
    };

    const expectedAddress: Address = {
      addressLine1: '20 St S',
      addressLine2: 'Suite-636',
      municipality: 'Calgary',
      subdivisionCode: 'AB',
      postalCode: 'T3H 2V4',
      country: 'CA',
    };

    expect(mapSuggestionToAddress(suggestion)).toEqual(expectedAddress);
  });

  it('should handle different suite notations (Apt, Unit, #)', () => {
    const suggestion: Suggestion = {
      Id: 'CA|CP|A|10010614',
      Text: 'Apt-456 100 Main St',
      Highlight: '1-3',
      Cursor: 0,
      Description: 'Lethbridge, AB, T1K 3M4',
      Next: 'Retrieve',
    };

    const expectedAddress: Address = {
      addressLine1: '100 Main St',
      addressLine2: 'Apt-456',
      municipality: 'Lethbridge',
      subdivisionCode: 'AB',
      postalCode: 'T1K 3M4',
      country: 'CA',
    };

    expect(mapSuggestionToAddress(suggestion)).toEqual(expectedAddress);
  });
});

describe('filterSuggestionsWithoutAddressCount', () => {
  it('should filter out suggestions where Description ends with "Addresses"', () => {
    const suggestions = [
      {
        Id: '1',
        Text: '123 Main St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Toronto, ON, M5V 3K2',
        Next: 'Retrieve',
      },
      {
        Id: '2',
        Text: '456 Another St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Haliburton, ON, K0M 1S0 - 9 Addresses',
        Next: 'Retrieve',
      },
      {
        Id: '3',
        Text: '789 Some Place',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Mississauga, ON, L5B 1H7',
        Next: 'Retrieve',
      },
    ];

    const filteredSuggestions = filterSuggestionsWithoutAddressCount(suggestions);

    expect(filteredSuggestions).toHaveLength(2);
    expect(filteredSuggestions).toEqual([
      {
        Id: '1',
        Text: '123 Main St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Toronto, ON, M5V 3K2',
        Next: 'Retrieve',
      },
      {
        Id: '3',
        Text: '789 Some Place',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Mississauga, ON, L5B 1H7',
        Next: 'Retrieve',
      },
    ]);
  });

  it('should return all suggestions if none of them end with "Addresses"', () => {
    const suggestions = [
      {
        Id: '1',
        Text: '123 Main St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Toronto, ON, M5V 3K2',
        Next: 'Retrieve',
      },
      {
        Id: '2',
        Text: '456 Another St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Haliburton, ON, K0M 1S0',
        Next: 'Retrieve',
      },
    ];

    const filteredSuggestions = filterSuggestionsWithoutAddressCount(suggestions);

    expect(filteredSuggestions).toHaveLength(2);
  });

  it('should return an empty array if all suggestions end with "Addresses"', () => {
    const suggestions = [
      {
        Id: '1',
        Text: '123 Main St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Toronto, ON, M5V 3K2 - 3 Addresses',
        Next: 'Retrieve',
      },
      {
        Id: '2',
        Text: '456 Another St',
        Highlight: '1-3',
        Cursor: 0,
        Description: 'Haliburton, ON, K0M 1S0 - 9 Addresses',
        Next: 'Retrieve',
      },
    ];

    const filteredSuggestions = filterSuggestionsWithoutAddressCount(suggestions);

    expect(filteredSuggestions).toHaveLength(0);
  });
});
describe('validatePostalCode', () => {
  it('returns true for a valid postal code (K1A 0B1)', () => {
    expect(validatePostalCode('K1A 0B1')).toBe(true);
  });

  it('returns true for a valid postal code (X9X 9X9)', () => {
    expect(validatePostalCode('X9X 9X9')).toBe(true);
  });

  it('returns false for missing space (A1A1A1)', () => {
    expect(validatePostalCode('A1A1A1')).toBe(false);
  });

  it('returns false for incorrect format with no letters (123 456)', () => {
    expect(validatePostalCode('123 456')).toBe(false);
  });

  it('returns false for incorrect format with special characters (A1A-1A1)', () => {
    expect(validatePostalCode('A1A-1A1')).toBe(false);
  });

  it('returns false for input with too many characters (A1A 1A12)', () => {
    expect(validatePostalCode('A1A 1A12')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validatePostalCode('')).toBe(false);
  });
});

describe('handlePostalCodeValidation', () => {
  it('should set postal code error when postal code is invalid and value length >= 4', () => {
    const validatePc = false;
    const message = 'Invalid postal code';
    const value = '1234';
    const errors = {};

    const updatedErrors = handlePostalCodeValidation(validatePc, message, value, errors);

    expect(updatedErrors).toEqual({ postalCode: 'Invalid postal code' });
  });

  it('should not set postal code error when value length is less than 4', () => {
    const validatePc = false;
    const message = 'Invalid postal code';
    const value = '123';
    const errors = {};

    const updatedErrors = handlePostalCodeValidation(validatePc, message, value, errors);

    expect(updatedErrors).toEqual({});
  });

  it('should remove postal code error when postal code is valid', () => {
    const validatePc = true;
    const message = 'Invalid postal code';
    const value = '1234';
    const errors = { postalCode: 'Invalid postal code' };

    const updatedErrors = handlePostalCodeValidation(validatePc, message, value, errors);

    expect(updatedErrors).toEqual({});
  });

  it('should not modify other errors when setting postal code error', () => {
    const validatePc = false;
    const message = 'Invalid postal code';
    const value = '1234';
    const errors = { city: 'City is required' };

    const updatedErrors = handlePostalCodeValidation(validatePc, message, value, errors);

    expect(updatedErrors).toEqual({
      city: 'City is required',
      postalCode: 'Invalid postal code',
    });
  });

  it('should not modify other errors when removing postal code error', () => {
    const validatePc = true;
    const message = 'Invalid postal code';
    const value = '1234';
    const errors = { city: 'City is required', postalCode: 'Invalid postal code' };

    const updatedErrors = handlePostalCodeValidation(validatePc, message, value, errors);

    expect(updatedErrors).toEqual({
      city: 'City is required',
    });
  });
});
describe('formatPostalCode', () => {
  it('should add a space after the third character if the string length is >= 4 and no space exists', () => {
    expect(formatPostalCode('A0A0A0')).toBe('A0A 0A0');
    expect(formatPostalCode('12345')).toBe('123 45');
  });

  it('should not modify a string that already contains a space after the third character', () => {
    expect(formatPostalCode('A0A 0A0')).toBe('A0A 0A0');
    expect(formatPostalCode('123 45')).toBe('123 45');
  });

  it('should not modify strings with fewer than 4 characters', () => {
    expect(formatPostalCode('A0')).toBe('A0');
    expect(formatPostalCode('12')).toBe('12');
  });

  it('should return the original string if it already contains a space', () => {
    expect(formatPostalCode('A0A 0A0')).toBe('A0A 0A0');
    expect(formatPostalCode('A0A 123')).toBe('A0A 123');
  });

  it('should return the original string if the length is less than 4', () => {
    expect(formatPostalCode('A0')).toBe('A0');
    expect(formatPostalCode('A')).toBe('A');
  });
});

describe('detectPostalCodeType', () => {
  test.each([
    ['T3H 5Y1', 'full'],
    ['T3H5Y1', 'full'],
    ['t3h5y1', 'full'],
    ['T3H', 'partial'],
    ['T3H5', 'partial'],
    ['T3H5Y', 'partial'],
    ['T3', 'partial'],
    ['T3H 5', 'partial'],
    ['123 Main St', 'none'],
    ['', 'none'],
    ['Vancouver', 'none'],
    ['M4B-1B3', 'full'],
    ['k1a0b1', 'full'],
  ])('input "%s" → %s', (input, expected) => {
    expect(detectPostalCodeType(input)).toBe(expected);
  });
});

describe('formatPostalCodeIfNeeded', () => {
  test.each([
    ['t3h5y1', 'T3H 5Y1', 'full'],
    ['T3H5Y', 'T3H 5Y', 'partial'],
    ['T3H5', 'T3H 5', 'partial'],
    ['T3H', 'T3H ', 'partial'],
    ['123 Main St', '123 Main St', 'none'],
    ['T3H 5Y1', 'T3H 5Y1', 'full'],
    [' t3h5y1 ', 'T3H 5Y1', 'full'],
  ])('input "%s" (type %s) → "%s"', (input, expected) => {
    expect(formatPostalCodeIfNeeded(input)).toBe(expected);
  });
});

describe('handleAddressKeyDown', () => {
  const mockSuggestions = [
    { Text: 'A', Description: 'A1' },
    { Text: 'B', Description: 'B2' },
  ];

  it('increments index on ArrowDown', () => {
    const mockInput = jest.fn();
    const newIndex = handleAddressKeyDown('ArrowDown', '123', 0, mockSuggestions, mockInput, jest.fn());
    expect(newIndex).toBe(1);
    expect(mockInput).toHaveBeenCalledWith('123');
  });

  it('wraps to 0 on ArrowDown at end', () => {
    const newIndex = handleAddressKeyDown('ArrowDown', '123', 1, mockSuggestions, jest.fn(), jest.fn());
    expect(newIndex).toBe(0);
  });

  it('decrements index on ArrowUp', () => {
    const newIndex = handleAddressKeyDown('ArrowUp', '123', 1, mockSuggestions, jest.fn(), jest.fn());
    expect(newIndex).toBe(0);
  });

  it('wraps to end on ArrowUp at start', () => {
    const newIndex = handleAddressKeyDown('ArrowUp', '123', 0, mockSuggestions, jest.fn(), jest.fn());
    expect(newIndex).toBe(1);
  });

  it('calls onSelect on Enter', () => {
    const mockSelect = jest.fn();
    handleAddressKeyDown('Enter', '123', 0, mockSuggestions, jest.fn(), mockSelect);
    expect(mockSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });
});
