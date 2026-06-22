import { Request, Response } from 'express';
import { Logger } from 'winston';
import { createErrorHandler } from './errorHandler';
import { GoAError } from './errors';

function makeRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq(headers: Record<string, string> = {}): Partial<Request> {
  return { path: '/test', method: 'GET', headers } as Partial<Request>;
}

describe('createErrorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('responds with statusCode from GoAError.extra', () => {
    const handler = createErrorHandler();
    const err = new GoAError('Not found', { statusCode: 404 });
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('responds with statusCode from err.statusCode for non-GoAError errors', () => {
    const handler = createErrorHandler();
    const err = Object.assign(new Error('Bad request'), { statusCode: 400 });
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('defaults to 500 when no statusCode is present', () => {
    const handler = createErrorHandler();
    const err = new Error('Unexpected failure');
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('masks 5xx error messages in production', () => {
    process.env.NODE_ENV = 'production';
    const handler = createErrorHandler();
    const err = new Error('Database connection lost');
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('exposes error message for 5xx outside production', () => {
    process.env.NODE_ENV = 'development';
    const handler = createErrorHandler();
    const err = new Error('Database connection lost');
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ error: 'Database connection lost' });
  });

  it('does not mask 4xx error messages in production', () => {
    process.env.NODE_ENV = 'production';
    const handler = createErrorHandler();
    const err = new GoAError('Validation failed', { statusCode: 422 });
    const res = makeRes();

    handler(err, makeReq() as Request, res as Response, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed' });
  });

  it('logs error with request context when logger is provided', () => {
    const logger = { error: jest.fn() } as unknown as Logger;
    const handler = createErrorHandler(logger);
    const err = new GoAError('Forbidden', { statusCode: 403 });
    const req = makeReq({ 'x-correlation-id': 'abc-123' });
    const res = makeRes();

    handler(err, req as Request, res as Response, jest.fn());

    expect(logger.error).toHaveBeenCalledWith('Forbidden', {
      statusCode: 403,
      path: '/test',
      method: 'GET',
      correlationId: 'abc-123',
    });
  });

  it('does not throw when no logger is provided', () => {
    const handler = createErrorHandler();
    const err = new Error('Something went wrong');
    const res = makeRes();

    expect(() => handler(err, makeReq() as Request, res as Response, jest.fn())).not.toThrow();
  });
});
