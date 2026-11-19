import { assertDataPath, setValueAtPath, valueAtPath } from './dataPath';

describe('assertDataPath', () => {
  it('splits a path into segments', () => {
    expect(assertDataPath('applicant.documents.proof')).toEqual(['applicant', 'documents', 'proof']);
  });

  it('reads array indexes as numbers', () => {
    expect(assertDataPath('dependents[1].birthCertificate')).toEqual(['dependents', 1, 'birthCertificate']);
    expect(assertDataPath('matrix[0][2].cell')).toEqual(['matrix', 0, 2, 'cell']);
  });

  it('reads numeric segments, as the forms app writes them, as array indexes', () => {
    expect(assertDataPath('dependents.1.birthCertificate')).toEqual(['dependents', 1, 'birthCertificate']);
    expect(assertDataPath('supportingDocuments.0')).toEqual(['supportingDocuments', 0]);
  });

  it.each([
    '',
    'a..b',
    '.a',
    'a.',
    '__proto__.x',
    'a.constructor',
    'prototype',
    'a[]',
    'a[-1]',
    'a[x]',
    '[0]',
    'a[0]b',
    'constructor[0]',
  ])('rejects the path "%s"', (path) => {
    expect(() => assertDataPath(path)).toThrow("Invalid data path '" + path + "'.");
  });
});

describe('valueAtPath', () => {
  const data = {
    applicant: { name: 'Ada' },
    dependents: [{ name: 'Bo' }, { name: 'Cy', birthCertificate: 'urn:file' }],
    contactMethods: ['Email', 'Phone'],
  };

  it('reads nested values', () => {
    expect(valueAtPath(data, 'applicant.name')).toBe('Ada');
  });

  it('reads values inside arrays', () => {
    expect(valueAtPath(data, 'dependents[1].birthCertificate')).toBe('urn:file');
    expect(valueAtPath(data, 'contactMethods[0]')).toBe('Email');
  });

  it('returns undefined past the end of an array or through a missing value', () => {
    expect(valueAtPath(data, 'dependents[5].name')).toBeUndefined();
    expect(valueAtPath(data, 'applicant.address.city')).toBeUndefined();
    expect(valueAtPath(data, 'dependents.length')).toBeUndefined();
  });

  it('reads a number as a key on an object', () => {
    expect(valueAtPath({ docs: { 0: 'urn:a' } }, 'docs.0')).toBe('urn:a');
  });

  it('does not read inherited or unsafe properties', () => {
    expect(valueAtPath(data, 'applicant.toString')).toBeUndefined();
    expect(valueAtPath(data, '__proto__')).toBeUndefined();
  });
});

describe('setValueAtPath', () => {
  it('sets a value at a top level field', () => {
    const data: Record<string, unknown> = {};
    setValueAtPath(data, 'proof', 'x');

    expect(data).toEqual({ proof: 'x' });
  });

  it('creates missing parents', () => {
    const data: Record<string, unknown> = {};
    setValueAtPath(data, 'applicant.documents.proof', { Url: 'u' });

    expect(data).toEqual({ applicant: { documents: { proof: { Url: 'u' } } } });
  });

  it('keeps existing sibling values', () => {
    const data: Record<string, unknown> = { applicant: { name: 'Ada' } };
    setValueAtPath(data, 'applicant.proof', 'x');

    expect(data).toEqual({ applicant: { name: 'Ada', proof: 'x' } });
  });

  it('replaces null parents', () => {
    const data: Record<string, unknown> = { applicant: null };
    setValueAtPath(data, 'applicant.proof', 'x');

    expect(data).toEqual({ applicant: { proof: 'x' } });
  });

  it('sets a value inside an existing array item', () => {
    const data: Record<string, unknown> = { dependents: [{ name: 'Bo' }, { name: 'Cy' }] };
    setValueAtPath(data, 'dependents[1].birthCertificate', 'link');

    expect(data).toEqual({ dependents: [{ name: 'Bo' }, { name: 'Cy', birthCertificate: 'link' }] });
  });

  it('replaces an array item', () => {
    const data: Record<string, unknown> = { docs: ['urn:a', 'urn:b'] };
    setValueAtPath(data, 'docs[1]', 'link');

    expect(data).toEqual({ docs: ['urn:a', 'link'] });
  });

  it('sets values at the paths the forms app gives files', () => {
    const data: Record<string, unknown> = {
      supportingDocuments: ['urn:a', 'urn:b'],
      dependents: [{ name: 'Bo', birthCertificate: 'urn:c' }],
    };
    setValueAtPath(data, 'supportingDocuments.1', 'link-b');
    setValueAtPath(data, 'dependents.0.birthCertificate', 'link-c');

    expect(data).toEqual({
      supportingDocuments: ['urn:a', 'link-b'],
      dependents: [{ name: 'Bo', birthCertificate: 'link-c' }],
    });
  });

  it.each([
    ['a field on an array', { dependents: [] }, 'dependents.name'],
    ['through a value that is not an object', { applicant: 'Ada' }, 'applicant.proof'],
    ['at an index past the limit', { docs: [] }, 'docs.1001'],
  ])('refuses to set a value %s', (_case, data, path) => {
    expect(() => setValueAtPath(data as Record<string, unknown>, path, 'x')).toThrow(
      `Cannot set a value at data path '${path}'.`,
    );
  });

  it('creates a missing array, as older forms can have a file without its entry in the data', () => {
    const data: Record<string, unknown> = {};
    setValueAtPath(data, 'supportingDocuments.0', 'link-a');
    setValueAtPath(data, 'dependents.0.birthCertificate', 'link-b');

    expect(data).toEqual({ supportingDocuments: ['link-a'], dependents: [{ birthCertificate: 'link-b' }] });
  });

  it('sets a value past the end of an array, as before', () => {
    const data: Record<string, unknown> = { dependents: [{ name: 'Bo' }] };
    setValueAtPath(data, 'dependents.1.birthCertificate', 'link');

    expect(data).toEqual({ dependents: [{ name: 'Bo' }, { birthCertificate: 'link' }] });
  });

  it('treats a number as a key on an object, as before', () => {
    const data: Record<string, unknown> = { supportingDocuments: { 0: 'urn:a' } };
    setValueAtPath(data, 'supportingDocuments.0', 'link');

    expect(data).toEqual({ supportingDocuments: { 0: 'link' } });
  });

  it('does not pollute prototypes', () => {
    expect(() => setValueAtPath({}, '__proto__.polluted', true)).toThrow();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
