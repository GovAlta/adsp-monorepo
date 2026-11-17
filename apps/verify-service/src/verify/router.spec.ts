import { adspId, User } from '@abgov/adsp-service-sdk';
import * as express from 'express';
import { Express } from 'express';
import * as request from 'supertest';
import { createVerifyRouter } from './router';
import { VerifyService } from './service';

describe('createVerifyRouter', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'tester', name: 'Test User', tenantId, isCore: false, roles: [] } as unknown as User;
  const serviceMock = {
    generate: jest.fn(),
    verify: jest.fn(),
  };

  function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = user;
      req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
      next();
    });
    app.use('/verify/v1', createVerifyRouter({ service: serviceMock as unknown as VerifyService }));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    serviceMock.generate.mockResolvedValue({ key: 'test', code: 'CF4HKR', expiresAt: new Date() });
    serviceMock.verify.mockResolvedValue(false);
  });

  it('generates a code when the body has no code', async () => {
    const res = await request(createApp()).post('/verify/v1/codes/test').query({ expireIn: 5 });

    expect(res.status).toBe(200);
    expect(serviceMock.generate).toHaveBeenCalledWith(user, 'test', 5, tenantId);
    expect(serviceMock.verify).not.toHaveBeenCalled();
  });

  it('generates a code with the default expiry when expireIn is not set', async () => {
    await request(createApp()).post('/verify/v1/codes/test').send({});

    expect(serviceMock.generate).toHaveBeenCalledWith(user, 'test', 10, tenantId);
  });

  it('verifies a non-empty code', async () => {
    serviceMock.verify.mockResolvedValueOnce(true);

    const res = await request(createApp()).post('/verify/v1/codes/test').send({ code: 'CF4HKR' });

    expect(res.body).toEqual({ verified: true });
    expect(serviceMock.verify).toHaveBeenCalledWith(user, 'test', 'CF4HKR', tenantId);
    expect(serviceMock.generate).not.toHaveBeenCalled();
  });

  it('verifies an empty code instead of generating a code', async () => {
    const res = await request(createApp()).post('/verify/v1/codes/test').send({ code: '' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ verified: false });
    expect(serviceMock.verify).toHaveBeenCalledWith(user, 'test', '', tenantId);
    expect(serviceMock.generate).not.toHaveBeenCalled();
  });

  it('passes service errors to the next handler', async () => {
    serviceMock.verify.mockRejectedValueOnce(new Error('oops'));

    const res = await request(createApp()).post('/verify/v1/codes/test').send({ code: 'CF4HKR' });

    expect(res.status).toBe(500);
  });
});
