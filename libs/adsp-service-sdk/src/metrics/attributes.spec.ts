import { formatTenantAttribute } from './attributes';

describe('formatTenantAttribute', () => {
  const urn = 'urn:ads:platform:tenant-service:v2:/tenants/64d4eef5abc788a358dece8c';
  const id = '64d4eef5abc788a358dece8c';

  it('can combine the name and tenant id', () => {
    expect(formatTenantAttribute(urn, 'Wildfire')).toBe(`Wildfire ${id}`);
  });

  it('can keep the value free of regex metacharacters', () => {
    // Grafana's ${var:regex} formatter escapes these and PromQL rejects the escapes.
    expect(formatTenantAttribute(urn, 'Wildfire')).not.toMatch(/[\\/(){}[\]^$*+?|]/);
  });

  it('can fall back to the tenant id when there is no name', () => {
    expect(formatTenantAttribute(urn, undefined)).toBe(id);
  });

  it('can fall back to the name when there is no id', () => {
    expect(formatTenantAttribute(undefined, 'Wildfire')).toBe('Wildfire');
  });

  it('can handle an id that is not a urn', () => {
    expect(formatTenantAttribute('plain-id', 'Wildfire')).toBe('Wildfire plain-id');
  });

  it('can return undefined when there is no tenant context', () => {
    expect(formatTenantAttribute(undefined, undefined)).toBeUndefined();
  });
});
