import { getFileServicePath } from './file.slice';

describe('getFileServicePath', () => {
  it('returns the file resource path without a leading slash', () => {
    expect(getFileServicePath('urn:ads:platform:file-service:v1:/files/abc')).toBe('files/abc');
  });

  it('throws for a urn of another service', () => {
    expect(() => getFileServicePath('urn:ads:platform:task-service:v1:/tasks/1')).toThrow();
  });

  it('throws for a value that is not a urn', () => {
    expect(() => getFileServicePath('not-a-urn')).toThrow();
  });
});
