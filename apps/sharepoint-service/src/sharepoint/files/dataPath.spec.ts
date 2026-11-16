import { assertDataPath, setValueAtPath } from './dataPath';

describe('assertDataPath', () => {
  it('splits a path into segments', () => {
    expect(assertDataPath('applicant.documents.proof')).toEqual(['applicant', 'documents', 'proof']);
  });

  it.each(['', 'a..b', '.a', 'a.', '__proto__.x', 'a.constructor', 'prototype'])('rejects the path "%s"', (path) => {
    expect(() => assertDataPath(path)).toThrow("Invalid data path '" + path + "'.");
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

  it('refuses to go through a value that is not an object', () => {
    expect(() => setValueAtPath({ applicant: 'Ada' }, 'applicant.proof', 'x')).toThrow(
      "Cannot set a value at data path 'applicant.proof'.",
    );
  });

  it('does not pollute prototypes', () => {
    expect(() => setValueAtPath({}, '__proto__.polluted', true)).toThrow();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
