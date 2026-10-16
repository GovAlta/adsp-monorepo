jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  initializePlatform: jest.fn(),
  instrumentAxios: jest.fn(),
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFile: jest.fn((_path, _options, callback) => callback(null, '{}')),
}));
jest.mock('./postgres', () => ({
  createDatabase: jest.fn().mockResolvedValue({ knex: {}, isConnected: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('./environments/environment', () => ({
  environment: {
    CLIENT_ID: 'urn:ads:platform:audit-service',
    CLIENT_SECRET: 'test-only',
    KEYCLOAK_ROOT_URL: 'https://access.example.test',
    DIRECTORY_URL: 'https://directory.example.test',
    LOG_LEVEL: 'error',
    TRUSTED_PROXY: false,
  },
}));

import { adspId, ConfigurationService, initializePlatform, User } from '@abgov/adsp-service-sdk';
import { generateKeyPairSync } from 'crypto';
import { Application } from 'express';
import { sign, SignOptions } from 'jsonwebtoken';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { initializeApp } from './app';
import { AuditServiceRoles } from './audit';

describe('audit application authorization', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const serviceId = adspId`urn:ads:platform:audit-service`;
  const tenantA = {
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`,
    name: 'Case',
    realm: 'case-team',
  };
  const tenantB = {
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`,
    name: 'Payment',
    realm: 'payment-team',
  };
  const tenantService = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  let app: Application;

  function createStrategy(realm: string, isCore: boolean) {
    return new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: publicKey,
        algorithms: ['RS256'],
        audience: serviceId.toString(),
        issuer: `https://access.example.test/auth/realms/${realm}`,
      },
      (payload, done) => {
        const user: User = {
          id: payload.sub,
          name: payload.preferred_username,
          email: '',
          isCore,
          tenantId: isCore ? undefined : tenantA.id,
          roles: payload.resource_access?.[serviceId.toString()]?.roles || [],
          token: { ...payload, bearer: 'verified-by-passport' },
        };
        done(null, user);
      },
    );
  }

  function token(roles: string[], realm = tenantA.realm, options: SignOptions = {}) {
    return sign(
      {
        azp: 'urn:ads:case-team:case-service',
        preferred_username: 'audit-client',
        resource_access: { [serviceId.toString()]: { roles } },
      },
      privateKey,
      {
        algorithm: 'RS256',
        subject: 'audit-client',
        audience: serviceId.toString(),
        issuer: `https://access.example.test/auth/realms/${realm}`,
        expiresIn: '5m',
        ...options,
      },
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    configuration.getServiceConfiguration.mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: {},
    });
    jest.mocked(initializePlatform).mockResolvedValue({
      coreStrategy: createStrategy('core', true),
      tenantStrategy: createStrategy(tenantA.realm, false),
      tenantHandler: (req, _res, next) => {
        const tenantId = req.user.isCore ? req.query.tenantId : req.user.tenantId?.toString();
        if (tenantId) req.tenant = tenantId === tenantA.id.toString() ? tenantA : tenantB;
        next();
      },
      tenantService,
      configurationService: configuration,
      directory: { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() },
      eventService: { send: jest.fn() },
      tokenProvider: { getAccessToken: jest.fn() },
      configurationHandler: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue({}),
      clearCached: jest.fn(),
      metricsHandler: jest.fn(),
      traceHandler: (_req, _res, next) => next(),
      shutdownTelemetry: jest.fn(),
      logger,
    });

    app = await initializeApp();
  });

  it('registers all three roles with only the reader included in tenant-admin', () => {
    const registration = jest.mocked(initializePlatform).mock.calls[0][0];

    expect({ serviceId: registration.serviceId.toString(), roles: registration.roles }).toEqual({
      serviceId: serviceId.toString(),
      roles: [
        { role: AuditServiceRoles.Reader, description: expect.any(String), inTenantAdmin: true },
        { role: AuditServiceRoles.Writer, description: expect.any(String) },
        { role: AuditServiceRoles.Admin, description: expect.any(String) },
      ],
    });
  });

  describe.each([
    { method: 'get' as const, path: '/audit/v1/case-service/actions', role: AuditServiceRoles.Reader },
    { method: 'post' as const, path: '/audit/v1/case-service/events', role: AuditServiceRoles.Writer },
  ])('$method $path', ({ method, path, role }) => {
    it('returns 401 for a missing token', async () => {
      const response = await request(app)[method](path);

      expect(response.status).toBe(401);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it.each([
      ['malformed', () => 'invalid-token'],
      ['expired', () => token([role], tenantA.realm, { expiresIn: -1 })],
      ['wrong audience', () => token([role], tenantA.realm, { audience: 'urn:ads:platform:file-service' })],
      ['unknown issuer', () => token([role], 'unknown-realm')],
      [
        'invalid signature',
        () =>
          sign({}, wrongKey, {
            algorithm: 'RS256',
            audience: serviceId.toString(),
            issuer: 'https://access.example.test/auth/realms/core',
          }),
      ],
    ])('returns 401 for a %s token', async (_label, createToken) => {
      const response = await request(app)[method](path).auth(createToken(), { type: 'bearer' });

      expect(response.status).toBe(401);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it.each([tenantA.realm, 'core'])('returns 403 without the role for %s', async (realm) => {
      const response = await request(app)
        [method](path)
        .auth(token([], realm), { type: 'bearer' })
        .query({ tenantId: tenantA.id.toString() });

      expect(response.status).toBe(403);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });

    it('refuses a tenant token targeting another tenant despite holding the role', async () => {
      const response = await request(app)
        [method](path)
        .auth(token([role]), { type: 'bearer' })
        .query({ tenantId: tenantB.id.toString() });

      expect(response.status).toBe(403);
      expect(configuration.getServiceConfiguration).not.toHaveBeenCalled();
    });
  });

  it('accepts a tenant reader token and resolves its tenant', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader]), { type: 'bearer' })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantA.id);
  });

  it('accepts a Core reader for an explicitly selected tenant', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader], 'core'), { type: 'bearer' })
      .query({ tenantId: tenantB.id.toString() })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', tenantB.id);
  });

  it('preserves Core-only catalog access without tenant context', async () => {
    await request(app)
      .get('/audit/v1/case-service/actions')
      .auth(token([AuditServiceRoles.Reader], 'core'), { type: 'bearer' })
      .expect(200);

    expect(configuration.getServiceConfiguration).toHaveBeenCalledWith('actions-case-service', undefined);
  });

  it.each(['/', '/health', '/swagger/docs/v1'])('keeps infrastructure endpoint %s public', async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
  });
});
