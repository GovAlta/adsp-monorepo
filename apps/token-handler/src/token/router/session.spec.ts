import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Store } from 'express-session';
import * as passport from 'passport';

import { createSessionRouter, getSessionInformation } from './session';
import { ServiceRoles } from '../roles';

describe('session router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const serviceId = adspId`urn:ads:platform:token-handler`;
  const sessionStoreMock = {
    all: jest.fn(),
  };

  beforeEach(() => {
    sessionStoreMock.all.mockClear();
  });

  describe('createSessionRouter', () => {
    it('can create handler', () => {
      const router = createSessionRouter({ passport, serviceId, sessionStore: sessionStoreMock as unknown as Store });
      expect(router).toBeTruthy();
    });
  });

  describe('getSessionInformation', () => {
    it('can create handler', () => {
      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      expect(handler).toBeTruthy();
    });

    it('can handle session request', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceRoles.Admin],
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const sessions = [
        {
          cookie: {},
          passport: {
            user: {
              tenantId: tenantId.toString(),
              id: 'test',
              name: 'tester',
              email: 'tester@test.co',
              roles: [],
              refreshExp: Date.now() / 1000 + 1800,
              authenticatedBy: 'test',
            },
          },
        },
        {
          cookie: {},
          passport: {
            user: {
              tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/other',
              id: 'other',
              name: 'other',
              email: 'other@test.co',
              roles: [],
              refreshExp: Date.now() / 1000 + 1800,
              authenticatedBy: 'test',
            },
          },
        },
        { cookie: {} },
      ];
      sessionStoreMock.all.mockImplementationOnce((cb) => cb(null, sessions));

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: tenantId.toString(),
            id: 'test',
            name: 'tester',
            email: 'tester@test.co',
            authenticatedBy: 'test',
          }),
        ])
      );
      expect(res.send.mock.calls[0][0]).toHaveLength(1);
      expect(next).not.toHaveBeenCalled();
    });

    it('can handle session request for session admin with client prefixed role', async () => {
      const req = {
        user: { tenantId, id: 'admin', roles: [`${serviceId}:${ServiceRoles.Admin}`] },
        session: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      sessionStoreMock.all.mockImplementationOnce((cb) =>
        cb(null, {
          sid1: {
            cookie: {},
            passport: {
              user: { tenantId: tenantId.toString(), id: 'test', refreshExp: Date.now() / 1000 + 1800, roles: [] },
            },
          },
        })
      );

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(sessionStoreMock.all).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith([expect.objectContaining({ tenantId: tenantId.toString(), id: 'test' })]);
    });

    it('can handle empty session store', async () => {
      const req = { user: { tenantId, id: 'admin', roles: [ServiceRoles.Admin] } };
      const res = { send: jest.fn() };
      const next = jest.fn();

      sessionStoreMock.all.mockImplementationOnce((cb) => cb(null, null));

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith([]);
    });

    it('can handle session request for current user', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [],
          name: 'current-tester',
          email: 'tester@test.co',
          refreshExp: Date.now() / 1000 + 1800,
          authenticatedBy: 'test',
        },
        session: { passport: { user: { id: 'test' } } },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: tenantId.toString(),
            id: 'test',
            name: 'current-tester',
            email: 'tester@test.co',
            authenticatedBy: 'test',
          }),
        ])
      );
      expect(sessionStoreMock.all).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('can handle session user without session or permission', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [],
          name: 'current-tester',
          email: 'tester@test.co',
          refreshExp: Date.now() / 1000 + 1800,
          authenticatedBy: 'test',
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([]));
      expect(sessionStoreMock.all).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with error on store error', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceRoles.Admin],
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const err = new Error('Oh noes!');
      sessionStoreMock.all.mockImplementationOnce((cb) => cb(err));

      const handler = getSessionInformation(sessionStoreMock as unknown as Store, serviceId);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
