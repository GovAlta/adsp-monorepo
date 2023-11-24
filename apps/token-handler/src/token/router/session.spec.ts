import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Store } from 'express-session';
import * as passport from 'passport';

import { createSessionRouter, getSessionInformation } from './session';
import { ServiceRoles } from '../roles';

describe('session router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const sessionStoreMock = {
    all: jest.fn(),
  };

  beforeEach(() => {
    sessionStoreMock.all.mockClear();
  });

  describe('createSessionRouter', () => {
    it('can create handler', () => {
      const router = createSessionRouter({ passport, sessionStore: sessionStoreMock as unknown as Store });
      expect(router).toBeTruthy();
    });
  });

  describe('getSessionInformation', () => {
    it('can create handler', () => {
      const handler = getSessionInformation(sessionStoreMock as unknown as Store);
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
          tenantId,
          id: 'test',
          name: 'tester',
          email: 'tester@test.co',
          roles: [],
          refreshExp: Date.now() / 1000 + 1800,
          authenticatedBy: 'test',
        },
      ];
      sessionStoreMock.all.mockImplementationOnce((cb) => cb(null, sessions));

      const handler = getSessionInformation(sessionStoreMock as unknown as Store);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tenantId: sessions[0].tenantId.toString(),
            id: 'test',
            name: 'tester',
            email: 'tester@test.co',
            authenticatedBy: 'test',
          }),
        ])
      );
      expect(next).not.toHaveBeenCalled();
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
        session: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSessionInformation(sessionStoreMock as unknown as Store);
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

      const handler = getSessionInformation(sessionStoreMock as unknown as Store);
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

      const handler = getSessionInformation(sessionStoreMock as unknown as Store);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
