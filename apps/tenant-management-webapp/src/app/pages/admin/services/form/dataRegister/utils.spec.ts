import { getSeparatorHelpText, parseUrn, urnCompare, validateRegisterJson, validateSeparatorMatch } from './utils';

describe('getSeparatorHelpText', () => {
  it('returns help text for comma separator', () => {
    const result = getSeparatorHelpText('comma');

    expect(result).toContain('comma');
  });

  it('returns help text for newline separator', () => {
    const result = getSeparatorHelpText('newline');

    expect(result).toContain('line');
  });

  it('returns help text for semicolon separator', () => {
    const result = getSeparatorHelpText('semicolon');

    expect(result).toContain('semicolon');
  });

  it('returns help text for json separator', () => {
    const result = getSeparatorHelpText('json');

    expect(result).toContain('JSON');
  });
});

describe('validateSeparatorMatch', () => {
  it('returns no error for an empty value', () => {
    const result = validateSeparatorMatch('', 'comma');

    expect(result).toBe('');
  });

  it('returns no error when data uses the selected comma separator', () => {
    const result = validateSeparatorMatch('Monday, Tuesday, Wednesday', 'comma');

    expect(result).toBe('');
  });

  it('returns no error for a single value with no separator present', () => {
    const result = validateSeparatorMatch('Monday', 'comma');

    expect(result).toBe('');
  });

  it('returns no error when data uses the selected newline separator', () => {
    const result = validateSeparatorMatch('Monday\nTuesday\nWednesday', 'newline');

    expect(result).toBe('');
  });

  it('returns no error when data uses the selected semicolon separator', () => {
    const result = validateSeparatorMatch('Monday; Tuesday; Wednesday', 'semicolon');

    expect(result).toBe('');
  });

  it('returns an error when data uses semicolons but comma is selected', () => {
    const result = validateSeparatorMatch('Monday; Tuesday; Wednesday', 'comma');

    expect(result).toContain('does not appear to use the selected');
  });

  it('returns an error when data is on multiple lines but a non-newline separator is selected', () => {
    const result = validateSeparatorMatch('Monday\nTuesday\nWednesday', 'comma');

    expect(result).toContain('does not appear to use the selected');
  });

  it('never returns an error for the json separator', () => {
    const result = validateSeparatorMatch('not; valid, json\ndata', 'json');

    expect(result).toBe('');
  });
});

describe('validateRegisterJson', () => {
  it('returns an error message for invalid JSON', () => {
    const result = validateRegisterJson('not json');

    expect(result).toBe('Please provide valid JSON');
  });

  it('returns an error message when JSON is not an array of strings or objects', () => {
    const result = validateRegisterJson('123');

    expect(result).not.toBe('');
  });

  it('returns no error for a valid array of strings', () => {
    const result = validateRegisterJson('["Monday", "Tuesday"]');

    expect(result).toBe('');
  });

  it('returns no error for a valid array of objects', () => {
    const result = validateRegisterJson('[{"label":"Alberta","value":"AB"}]');

    expect(result).toBe('');
  });
});

describe('parseUrn', () => {
  it('parses the namespace and name from a register urn', () => {
    const result = parseUrn('urn:ads:platform:configuration:v2:/configuration/data-register/weekdays');

    expect(result).toEqual({ namespace: 'data-register', name: 'weekdays' });
  });

  it('returns empty strings when the urn is empty', () => {
    const result = parseUrn('');

    expect(result).toEqual({ namespace: '', name: '' });
  });
});

describe('urnCompare', () => {
  it('sorts registers alphabetically by name', () => {
    const a = { urn: 'urn:ads:platform:configuration:v2:/configuration/data-register/zebra', data: [] };
    const b = { urn: 'urn:ads:platform:configuration:v2:/configuration/data-register/alpha', data: [] };

    const result = urnCompare(a, b);

    expect(result).toBeGreaterThan(0);
  });
});
