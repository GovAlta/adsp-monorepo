import { Request, Response } from 'express';
import { authorize } from './middleware';
import { UnauthorizedUserError } from './assert';
import { User } from './user';
import { adspId } from '../utils';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

function makeUser(roles: string[]): User {
  return {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    roles,
    tenantId,
    isCore: false,
    token: null,
  };
}

function makeReq(user?: User): Partial<Request> {
  return { user } as Partial<Request>;
}

describe('authorize', () => {
  it('calls next() when user has a required role', () => {
    const middleware = authorize('admin');
    const req = makeReq(makeUser(['admin', 'user']));
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() when user has one of multiple required roles', () => {
    const middleware = authorize('editor', 'admin');
    const req = makeReq(makeUser(['editor']));
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(UnauthorizedUserError) when user lacks required role', () => {
    const middleware = authorize('admin');
    const req = makeReq(makeUser(['user']));
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });

  it('calls next(UnauthorizedUserError) when req.user is not set', () => {
    const middleware = authorize('admin');
    const req = makeReq(undefined);
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });

  it('passes UnauthorizedUserError with 403 status code', () => {
    const middleware = authorize('admin');
    const req = makeReq(makeUser([]));
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    const err = next.mock.calls[0][0] as UnauthorizedUserError;
    expect(err.extra.statusCode).toBe(403);
  });
});
