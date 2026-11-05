import { getConnection, registerConnection } from './connections';

describe('connections', () => {
  it('returns undefined when no connection is registered for a tenant and destination', () => {
    const result = getConnection('tenant-a', 'unregistered-destination');

    expect(result).toBeUndefined();
  });

  it('returns the registered connection for a tenant and destination', () => {
    const connection = { azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' };
    registerConnection('tenant-a', 'intake-form', connection);

    const result = getConnection('tenant-a', 'intake-form');

    expect(result).toEqual(connection);
  });

  it('keeps connections scoped per ADSP tenant', () => {
    const connection = { azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' };
    registerConnection('tenant-b', 'intake-form', connection);

    const result = getConnection('tenant-c', 'intake-form');

    expect(result).toBeUndefined();
  });

  it('overwrites an existing connection when registered again for the same destination', () => {
    registerConnection('tenant-d', 'intake-form', {
      azureTenantId: 'old-tenant',
      clientId: 'old-client',
      clientSecret: 'old-secret',
    });
    const updated = { azureTenantId: 'new-tenant', clientId: 'new-client', clientSecret: 'new-secret' };
    registerConnection('tenant-d', 'intake-form', updated);

    const result = getConnection('tenant-d', 'intake-form');

    expect(result).toEqual(updated);
  });
});
