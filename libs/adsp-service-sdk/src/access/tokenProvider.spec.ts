import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { TokenProviderImpl } from './tokenProvider';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('TokenProvider', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  beforeEach(() => axiosMock.post.mockReset());

  it('can be constructed', () => {
    const provider = new TokenProviderImpl(logger, adspId`urn:ads:platform:test`, '', new URL('http://totally-access'));

    expect(provider).toBeTruthy();
  });

  it('can get access token', async () => {
    const provider = new TokenProviderImpl(logger, adspId`urn:ads:platform:test`, '', new URL('http://totally-access'));

    const token = 'this is some token';
    axiosMock.post.mockReturnValueOnce(Promise.resolve({ data: { access_token: token, expires_in: 300 } }));

    const result = await provider.getAccessToken();

    expect(result).toBe(token);
  });

  it('can return active token', async () => {
    const provider = new TokenProviderImpl(logger, adspId`urn:ads:platform:test`, '', new URL('http://totally-access'));

    const token = 'this is some token';
    axiosMock.post.mockReturnValueOnce(Promise.resolve({ data: { access_token: token, expires_in: 300 } }));

    let result = await provider.getAccessToken();
    result = await provider.getAccessToken();

    expect(result).toBe(token);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  it('can retrieve new when token expired', async () => {
    const provider = new TokenProviderImpl(logger, adspId`urn:ads:platform:test`, '', new URL('http://totally-access'));

    const token = 'this is some token';

    // This expiry is within the threshold, so a new token should be requested.
    axiosMock.post.mockReturnValueOnce(Promise.resolve({ data: { access_token: 'expired', expires_in: 10 } }));
    axiosMock.post.mockReturnValueOnce(Promise.resolve({ data: { access_token: token, expires_in: 300 } }));

    let result = await provider.getAccessToken();
    result = await provider.getAccessToken();

    expect(result).toBe(token);
    expect(axiosMock.post).toHaveBeenCalledTimes(2);
  });

  it('can handle throw request error', async () => {
    const provider = new TokenProviderImpl(logger, adspId`urn:ads:platform:test`, '', new URL('http://totally-access'));

    axiosMock.post.mockRejectedValueOnce(new Error('Something went terribly wrong.'));

    await expect(provider.getAccessToken()).rejects.toThrow(/Something went terribly wrong./);
  });
});
