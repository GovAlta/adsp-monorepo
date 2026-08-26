import { formatTenantAttribute } from './attributes';

describe('formatTenantAttribute', () => {
  const urn = 'urn:ads:platform:tenant-service:v2:/tenants/64d4eef5abc788a358dece8c';

  it('can combine the name and urn', () => {
    expect(formatTenantAttribute(urn, 'Wildfire')).toBe(`Wildfire (${urn})`);
  });

  it('can fall back to the urn when there is no name', () => {
    expect(formatTenantAttribute(urn, undefined)).toBe(urn);
  });

  it('can fall back to the name when there is no urn', () => {
    expect(formatTenantAttribute(undefined, 'Wildfire')).toBe('Wildfire');
  });

  it('can return undefined when there is no tenant context', () => {
    expect(formatTenantAttribute(undefined, undefined)).toBeUndefined();
  });
});
