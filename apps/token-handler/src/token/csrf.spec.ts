import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import 'express-session';
import { generateCsrfToken, csrfHandler } from './csrf';

describe('csrf', () => {
  describe('generateCsrfToken', () => {
    it('can generate token', () => {
      const req = {
        session: {},
      };
      const res = {
        cookie: jest.fn(),
      };

      generateCsrfToken(req as unknown as Request, res as unknown as Response);
      expect(req.session['csrfToken']).toBeTruthy();
      expect(res.cookie).toHaveBeenCalledWith(
        'XSRF-TOKEN',
        req.session['csrfToken'],
        expect.objectContaining({ httpOnly: false, sameSite: 'strict' })
      );
    });

    it('can throw if no session', () => {
      const req = {};
      const res = {
        cookie: jest.fn(),
      };

      expect(() => generateCsrfToken(req as unknown as Request, res as unknown as Response)).toThrowError();
    });
  });
  describe('csrfHandler', () => {
    it('can verify token', () => {
      const req = {
        method: 'POST',
        session: {
          csrfToken: 'abc-123',
        },
        headers: {
          ['x-xsrf-token']: 'abc-123',
        },
      };
      const res = {};
      const next = jest.fn();

      csrfHandler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(undefined);
    });

    it('can ignore for whitelisted methods', () => {
      const req = {
        method: 'HEAD',
      };
      const res = {};
      const next = jest.fn();

      csrfHandler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with error if no session', () => {
      const req = {
        method: 'POST',
        headers: {
          ['x-xsrf-token']: 'abc-123',
        },
      };
      const res = {};
      const next = jest.fn();

      csrfHandler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can call next with invalid operation if token mismatch', () => {
      const req = {
        method: 'POST',
        session: {
          csrfToken: 'abc-123',
        },
        headers: {
          ['x-xsrf-token']: 'abc-321',
        },
      };
      const res = {};
      const next = jest.fn();

      csrfHandler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });
});
