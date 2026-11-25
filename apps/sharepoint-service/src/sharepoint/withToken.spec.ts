import { adspId } from '@abgov/adsp-service-sdk';
import { SharePointError } from './errors';
import { GraphTokenProvider } from './graph';
import { withToken } from './withToken';

describe('withToken', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
  const rejected = () => new SharePointError('graph:InvalidAuthenticationToken', false);
  let tokens: { getToken: jest.Mock; evict: jest.Mock };

  beforeEach(() => {
    tokens = {
      getToken: jest.fn().mockResolvedValueOnce('token-1').mockResolvedValueOnce('token-2'),
      evict: jest.fn(),
    };
  });

  const run = (call: (token: string) => Promise<string>) =>
    withToken(tokens as unknown as GraphTokenProvider, tenantId, connection, call);

  it('calls with the cached token', async () => {
    expect(await run(async (token) => `called with ${token}`)).toBe('called with token-1');
    expect(tokens.evict).not.toHaveBeenCalled();
  });

  it('gets a new token and calls once more when the token is rejected', async () => {
    const call = jest.fn().mockRejectedValueOnce(rejected()).mockResolvedValueOnce('done');

    expect(await run(call)).toBe('done');
    expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');
    expect(call.mock.calls).toEqual([['token-1'], ['token-2']]);
  });

  it('gives up when the new token is rejected too', async () => {
    const call = jest.fn().mockRejectedValue(rejected());

    await expect(run(call)).rejects.toMatchObject({ errorCode: 'graph:InvalidAuthenticationToken' });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('does not call again for other errors', async () => {
    const call = jest.fn().mockRejectedValue(new SharePointError('graph:accessDenied', false));

    await expect(run(call)).rejects.toMatchObject({ errorCode: 'graph:accessDenied' });
    expect(call).toHaveBeenCalledTimes(1);
    expect(tokens.evict).not.toHaveBeenCalled();
  });
});
