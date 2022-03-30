import { Request, Response } from 'express';
import { body, checkSchema } from 'express-validator';
import { ValidationFailedError } from './validationFailed';
import { createValidationHandler } from './validationHandler';

describe('validationHandler', () => {
  it('can validate', async () => {
    const validationHandlers = createValidationHandler(
      checkSchema(
        {
          timestamp: { optional: true, isISO8601: true },
          context: { optional: true, isObject: true },
          correlationId: { optional: true, isString: true },
        },
        ['body']
      )
    );

    const req = {
      body: {},
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    for (const handler of validationHandlers) {
      await handler(req as Request, res as unknown as Response, next);
    }
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    expect(res.send).not.toHaveBeenCalled();
  });

  it('can validate and fail', async () => {
    const validationHandlers = createValidationHandler(
      checkSchema(
        {
          timestamp: { optional: true, isISO8601: true },
          context: { optional: true, isObject: true },
          correlationId: { optional: true, isString: true },
        },
        ['body']
      )
    );

    const req = {
      body: {
        timestamp: '123',
        context: 'not an object',
      },
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    for (const handler of validationHandlers) {
      await handler(req as Request, res as unknown as Response, next);
    }
    expect(next).toHaveBeenCalledWith(expect.any(ValidationFailedError));
    expect(res.send).not.toHaveBeenCalled();
  });

  it('can handle no result', async () => {
    const validationHandlers = createValidationHandler([]);

    const req = {
      body: {},
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    for (const handler of validationHandlers) {
      await handler(req as Request, res as unknown as Response, next);
    }
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    expect(res.send).not.toHaveBeenCalled();
  });

  it('can handle single validator and fail', async () => {
    const validationHandlers = createValidationHandler(body('timestamp').isISO8601());

    const req = {
      body: {
        timestamp: '123',
        context: 'not an object',
      },
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    for (const handler of validationHandlers) {
      await handler(req as Request, res as unknown as Response, next);
    }
    expect(next).toHaveBeenCalledWith(expect.any(ValidationFailedError));
    expect(res.send).not.toHaveBeenCalled();
  });
});
