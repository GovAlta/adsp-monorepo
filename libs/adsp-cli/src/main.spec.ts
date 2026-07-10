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
});
