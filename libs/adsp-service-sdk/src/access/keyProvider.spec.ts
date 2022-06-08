import axios from 'axios';
import type { Request } from 'express';
import jwtDecode from 'jwt-decode';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { IssuerCache } from './issuerCache';
import { TenantKeyProvider } from './keyProvider';

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('jwt-decode');
const jwtDecodeMock = jwtDecode as jest.Mock;
jwtDecodeMock.mockImplementation((_, options: { header: boolean }) =>
  options?.header ? { kid: 'my-key' } : { iss: 'test' }
);

jest.mock('jwks-rsa', () => {
  class FakeJwksClient {
    getSigningKey = jest.fn((_kid, keyCb) => keyCb(null, { getPublicKey: () => 'test' }));
  }
  return {
    JwksClient: FakeJwksClient,
  };
});

describe('TenantKeyProvider', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const issuerMock = {
    getTenantByIssuer: jest.fn(),
  } as unknown as jest.Mocked<IssuerCache>;

  beforeEach(() => axiosMock.get.mockReset());

  it('can be constructed', () => {
    const provider = new TenantKeyProvider(logger, new URL('http://totally-access'), issuerMock);
    expect(provider).toBeTruthy();
  });

  it('can handle request with jwks client from cache', (done) => {
    const provider = new TenantKeyProvider(logger, new URL('http://totally-access'), issuerMock);
    const req: Request = {} as Request;

    const key = 'this is some key';
    cacheMock.mockReturnValueOnce({
      getSigningKey: jest.fn((_kid, keyCb) => keyCb(null, { getPublicKey: () => key })),
    });
    provider.keyRequestHandler(req, '', (err, k) => {
      expect(k).toBe(key);
      done(err);
    });
  });

  it('can create jwks client on cache miss', (done) => {
    const provider = new TenantKeyProvider(logger, new URL('http://totally-access'), issuerMock);
    const req: Request = {} as Request;

    const key = 'test';

    cacheMock.mockReturnValueOnce(null);
    issuerMock.getTenantByIssuer.mockResolvedValueOnce({
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    });

    axiosMock.get.mockResolvedValueOnce({ data: { issuer: 'test', jwks_uri: 'http://totally-jwks' } });

    provider.keyRequestHandler(req, '', (err, k) => {
      expect(k).toBe(key);
      done(err);
    });
  });

  it('can throw for unknown tenant issuer in create jwks client', (done) => {
    const provider = new TenantKeyProvider(logger, new URL('http://totally-access'), issuerMock);
    const req: Request = {} as Request;

    cacheMock.mockReturnValueOnce(null);
    issuerMock.getTenantByIssuer.mockResolvedValueOnce(null);

    axiosMock.get.mockResolvedValueOnce({ data: { issuer: 'test', jwks_uri: 'http://totally-jwks' } });

    provider.keyRequestHandler(req, '', (err) => {
      expect(err).toBeTruthy();
      done();
    });
  });

  it('can throw for oidc metadata issuer not matching iss', (done) => {
    const provider = new TenantKeyProvider(logger, new URL('http://totally-access'), issuerMock);
    const req: Request = {} as Request;

    cacheMock.mockReturnValueOnce(null);
    issuerMock.getTenantByIssuer.mockResolvedValueOnce({
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    });

    axiosMock.get.mockResolvedValueOnce({ data: { issuer: 'test2', jwks_uri: 'http://totally-jwks' } });

    provider.keyRequestHandler(req, '', (err) => {
      expect(err).toBeTruthy();
      done();
    });
  });
});
