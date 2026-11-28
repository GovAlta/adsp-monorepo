import { getClientCredentialsUrl } from './links';

describe('getClientCredentialsUrl', () => {
  it('links to the Credentials tab of the client in the Keycloak admin console', () => {
    expect(getClientCredentialsUrl('https://access.test', 'tenant-a', 'client-id')).toBe(
      'https://access.test/admin/tenant-a/console/#/tenant-a/clients/client-id/credentials',
    );
  });
});
