import { AdspId, adspId, assertAdspId } from './adspId';

describe('adspId', () => {
  it('can parse namespace', () => {
    const result = adspId`urn:ads:test-sandbox`;

    expect(result).toBeTruthy();
    expect(result.type).toBe('namespace');
    expect(result.namespace).toBe('test-sandbox');
  });

  it('can parse service', () => {
    const result = adspId`urn:ads:test-sandbox:test-service`;

    expect(result).toBeTruthy();
    expect(result.type).toBe('service');
    expect(result.namespace).toBe('test-sandbox');
    expect(result.service).toBe('test-service');
  });

  it('can parse api', () => {
    const result = adspId`urn:ads:test-sandbox:test-service:v1`;

    expect(result).toBeTruthy();
    expect(result.type).toBe('api');
    expect(result.namespace).toBe('test-sandbox');
    expect(result.service).toBe('test-service');
    expect(result.api).toBe('v1');
  });

  it('can parse resource', () => {
    const result = adspId`urn:ads:test-sandbox:test-service:v1:/resource`;

    expect(result).toBeTruthy();
    expect(result.type).toBe('resource');
    expect(result.namespace).toBe('test-sandbox');
    expect(result.service).toBe('test-service');
    expect(result.api).toBe('v1');
    expect(result.resource).toBe('/resource');
  });

  it('can append adspId', () => {
    const api = adspId`urn:ads:test-sandbox:test-service:v1`;
    const result = adspId`${api}:/resource`;

    expect(result).toBeTruthy();
    expect(result.type).toBe('resource');
    expect(result.namespace).toBe('test-sandbox');
    expect(result.service).toBe('test-service');
    expect(result.api).toBe('v1');
    expect(result.resource).toBe('/resource');
  });

  it('fails for invalid scheme', () => {
    expect(() => adspId`urn:aps:test-sandbox:test-service:v1`).toThrow(/^ADSP ID .* must begin with: urn:ads:/);
  });

  it('fails for whitespace element', () => {
    expect(() => adspId`urn:ads:  :test-service:v1`).toThrow(/^ADSP ID cannot include empty element./);
  });

  // A caller that parses request input relies on the failure carrying a 400; a plain Error is reported
  // as an unhandled server fault instead.
  it('fails with a bad request for more segments than a resource', () => {
    expect(() => adspId`urn:ads:test-sandbox:test-service:v1:/resource:extra`).toThrow(
      expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) })
    );
  });

  it('fails with a bad request for a urn that is not a string', () => {
    expect(() => AdspId.parse(123 as never)).toThrow(
      expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) })
    );
  });

  it('can convert to string', () => {
    const id = adspId`urn:ads:test-sandbox:test-service:v1`;

    expect(id.toString()).toBe('urn:ads:test-sandbox:test-service:v1');
    expect(`${id}`).toBe('urn:ads:test-sandbox:test-service:v1');
  });

  it('can assert and pass', () => {
    const id = adspId`urn:ads:test-sandbox:test-service:v1`;
    assertAdspId(id, null, 'api');
  });

  it('can assert and fail', () => {
    const id = adspId`urn:ads:test-sandbox:test-service:v1`;
    expect(() => {
      assertAdspId(id, null, 'service');
    }).toThrow(/^ID must for resource type of: service/);
  });
});
