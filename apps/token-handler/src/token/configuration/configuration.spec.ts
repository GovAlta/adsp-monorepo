import { combineClients } from './configuration';

describe('combineClients', () => {
  const client = (name: string) => ({ id: name, name, targets: {} });

  it('can mark core and tenant clients', () => {
    const result = combineClients({ tenant: client('Tenant') }, { core: client('Core') });
    expect(result.tenant).toMatchObject({ name: 'Tenant', core: false });
    expect(result.core).toMatchObject({ name: 'Core', core: true });
  });

  it('can use the core client when the ID matches a tenant client', () => {
    const result = combineClients({ shared: client('Tenant') }, { shared: client('Core') });
    expect(Object.keys(result)).toEqual(['shared']);
    expect(result.shared).toMatchObject({ name: 'Core', core: true });
  });

  it('can combine when either configuration is missing', () => {
    expect(combineClients(undefined, undefined)).toEqual({});
    expect(combineClients({ a: client('A') }, undefined).a).toMatchObject({ core: false });
    expect(combineClients(undefined, { a: client('A') }).a).toMatchObject({ core: true });
  });
});
