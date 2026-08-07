import { parseLoginArgs } from './main';

describe('parseLoginArgs', () => {
  it('accepts dev/test/prod for --env', () => {
    expect(parseLoginArgs(['--env', 'dev'])).toEqual({ env: 'dev' });
    expect(parseLoginArgs(['--env', 'test'])).toEqual({ env: 'test' });
    expect(parseLoginArgs(['--env', 'prod'])).toEqual({ env: 'prod' });
  });

  it('throws a clear error for an unrecognized --env value', () => {
    expect(() => parseLoginArgs(['--env', 'staging'])).toThrow(
      "Invalid --env value 'staging'. Must be one of: dev, test, prod."
    );
  });

  it('combines --env with --realm/--tenant/--scope', () => {
    expect(parseLoginArgs(['--realm', 'my-realm', '--env', 'dev', '--scope', 'adsp-cli-admin'])).toEqual({
      realm: 'my-realm',
      env: 'dev',
      scopes: ['adsp-cli-admin'],
    });
  });

  it('parses --ci flag', () => {
    expect(parseLoginArgs(['--ci'])).toEqual({ ci: true });
  });

  it('parses --client-id and --client-secret', () => {
    expect(parseLoginArgs(['--client-id', 'my-client', '--client-secret', 'my-secret'])).toEqual({
      clientId: 'my-client',
      clientSecret: 'my-secret',
    });
  });

  it('combines --ci with --tenant, --client-id, --client-secret, and --env', () => {
    expect(
      parseLoginArgs(['--ci', '--tenant', 'my-tenant', '--client-id', 'my-client', '--client-secret', 'my-secret', '--env', 'test']),
    ).toEqual({
      ci: true,
      tenant: 'my-tenant',
      clientId: 'my-client',
      clientSecret: 'my-secret',
      env: 'test',
    });
  });
});
