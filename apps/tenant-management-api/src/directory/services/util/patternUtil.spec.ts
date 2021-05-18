import { validateUrn, validateHostname, validateVersion, validatePath } from './patternUtil';

describe('Patten utility unit test', () => {
  const hostname = 'maps.alberta.ca';
  const sampleUrn = 'urn:ads:platform:file-service';
  const version = 'v1';
  const path = '/files/v1/files/123456';
  const url = 'http://maps.alberta.ca';
  it('validate urn', () => {
    const shorterUrn = 'urn:abc';
    expect(validateUrn(shorterUrn)).toBeFalsy();
    expect(validateUrn(hostname)).toBeFalsy();
    expect(validateUrn(path)).toBeFalsy();
    expect(validateUrn(url)).toBeFalsy();
    expect(validateUrn(sampleUrn)).toBeTruthy();
  });

  it('validate hostname', () => {
    const invalidHostName = 'alberta%&32#.com';
    expect(validateHostname(sampleUrn)).toBeFalsy();
    expect(validateHostname(invalidHostName)).toBeFalsy();
    expect(validateHostname(path)).toBeFalsy();
    expect(validateHostname(url)).toBeFalsy();
    expect(validateHostname(hostname)).toBeTruthy();
  });
  it('validate api version', () => {
    const invalidApiVersion = 'v.1';
    expect(validateVersion(version)).toBeTruthy();
    expect(validateVersion(invalidApiVersion)).toBeFalsy();
  });

  it('validate resource path', () => {
    expect(validatePath(sampleUrn)).toBeFalsy();
    expect(validatePath(url)).toBeFalsy();
    expect(validatePath(hostname)).toBeFalsy();
    expect(validatePath(path)).toBeTruthy();
  });
});
