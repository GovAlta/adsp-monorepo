import { Request, Response } from 'express';
import { z } from 'zod';
import { REQ_BENCHMARK, RequestBenchmark } from '../metrics/types';
import { createValidationHandler, ValidationFailedError } from './validationHandler';

const NameSchema = z.object({ name: z.string() });
const EmailSchema = z.object({ email: z.string().email() });

function makeReq(body: unknown, query?: unknown, withBenchmark = false): Partial<Request> {
  const req: Partial<Request> = { body, query: query as Request['query'] };
  if (withBenchmark) {
    const benchmark: RequestBenchmark = { timings: {}, metrics: {} };
    req[REQ_BENCHMARK] = benchmark;
  }
  return req;
}

describe('createValidationHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('calls next() when body matches schema', () => {
    const middleware = createValidationHandler(NameSchema);
    const next = jest.fn();

    middleware(makeReq({ name: 'test' }) as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ValidationFailedError) when body fails schema', () => {
    const middleware = createValidationHandler(NameSchema);
    const next = jest.fn();

    middleware(makeReq({ name: 123 }) as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationFailedError));
  });

  it('passes ValidationFailedError with statusCode 400', () => {
    const middleware = createValidationHandler(NameSchema);
    const next = jest.fn();

    middleware(makeReq({ name: 123 }) as Request, {} as Response, next);

    const err = next.mock.calls[0][0] as ValidationFailedError;
    expect(err.extra.statusCode).toBe(400);
  });

  it('includes field path and message in error outside production', () => {
    process.env.NODE_ENV = 'development';
    const middleware = createValidationHandler(EmailSchema);
    const next = jest.fn();

    middleware(makeReq({ email: 'not-an-email' }) as Request, {} as Response, next);

    const err = next.mock.calls[0][0] as ValidationFailedError;
    expect(err.message).toContain('email');
    expect(err.message).toContain('Invalid email');
  });

  it('masks field details in production', () => {
    process.env.NODE_ENV = 'production';
    const middleware = createValidationHandler(EmailSchema);
    const next = jest.fn();

    middleware(makeReq({ email: 'not-an-email' }) as Request, {} as Response, next);

    const err = next.mock.calls[0][0] as ValidationFailedError;
    expect(err.message).toBe('Validation failed');
  });

  it('validates a custom source instead of req.body', () => {
    const QuerySchema = z.object({ page: z.string() });
    const middleware = createValidationHandler(QuerySchema, (req) => req.query);
    const next = jest.fn();

    middleware(makeReq({}, { page: '1' }) as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('fails when custom source does not match schema', () => {
    const QuerySchema = z.object({ page: z.string() });
    const middleware = createValidationHandler(QuerySchema, (req) => req.query);
    const next = jest.fn();

    middleware(makeReq({}, {}) as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationFailedError));
  });

  it('uses (root) path label for root-level errors', () => {
    process.env.NODE_ENV = 'development';
    const middleware = createValidationHandler(z.string());
    const next = jest.fn();

    middleware(makeReq({ not: 'a string' }) as Request, {} as Response, next);

    const err = next.mock.calls[0][0] as ValidationFailedError;
    expect(err.message).toContain('(root)');
  });

  it('records validation-time benchmark when context is present', () => {
    const middleware = createValidationHandler(NameSchema);
    const req = makeReq({ name: 'test' }, undefined, true);
    const next = jest.fn();

    middleware(req as Request, {} as Response, next);

    const benchmark = req[REQ_BENCHMARK] as RequestBenchmark;
    expect(benchmark.metrics['validation-time']).toBeGreaterThan(0);
  });

  it('does not throw when benchmark context is absent', () => {
    const middleware = createValidationHandler(NameSchema);
    const req = makeReq({ name: 'test' });
    const next = jest.fn();

    expect(() => middleware(req as Request, {} as Response, next)).not.toThrow();
  });
});
