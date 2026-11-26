import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createErrorHandler } from './handler';
import { NotFoundError } from './notFound';

describe('createErrorHandler', () => {
  const loggerMock = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as Logger;

  // Every method here is exercised: status/json on the recognized and body-parse paths, sendStatus
  // on the unrecognized path, and end when the headers have already gone out.
  const createRes = () => {
    const res = {
      headersSent: false,
      // Express leaves this at the default until something sets it, which is the bug the status
      // logging tests below pin down.
      statusCode: 200,
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      sendStatus: jest.fn(() => res),
      end: jest.fn(() => res),
    };
    return res;
  };

  const req = { path: '/form/v1/definitions/test/roles' };

  beforeEach(() => jest.clearAllMocks());

  // body-parser rejects an unparsable body with a SyntaxError that carries the raw body.
  const bodyParseError = () => {
    const err = new SyntaxError('Unexpected token } in JSON at position 12') as SyntaxError & {
      body?: string;
      status?: number;
    };
    err.body = '{"applicantRoles":}';
    err.status = HttpStatusCodes.BAD_REQUEST;
    return err;
  };

  it('reports malformed JSON as a bad request rather than a server error', () => {
    const res = createRes();

    createErrorHandler(loggerMock)(bodyParseError(), req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({ errorMessage: expect.stringContaining('Malformed request body') });
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  // A body over the limit is an http-errors PayloadTooLargeError: a plain Error carrying
  // body-parser's type and a status. It is not a SyntaxError and has no raw body, which is why
  // the original SyntaxError-only guard missed it and every oversized body came back as a 500.
  const payloadTooLargeError = () => {
    const err = new Error('request entity too large') as Error & {
      type?: string;
      status?: number;
      statusCode?: number;
    };
    err.name = 'PayloadTooLargeError';
    err.type = 'entity.too.large';
    err.status = HttpStatusCodes.REQUEST_TOO_LONG;
    err.statusCode = HttpStatusCodes.REQUEST_TOO_LONG;
    return err;
  };

  it('reports a body over the size limit as payload too large', () => {
    const res = createRes();

    createErrorHandler(loggerMock)(payloadTooLargeError(), req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.REQUEST_TOO_LONG);
    expect(res.json).toHaveBeenCalledWith({ errorMessage: expect.stringContaining('size limit') });
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it('does not treat an arbitrary error carrying a 4xx status as a body parse failure', () => {
    const err = new Error('upstream said no') as Error & { status?: number };
    err.status = HttpStatusCodes.NOT_FOUND;
    const res = createRes();

    createErrorHandler(loggerMock)(err, req as never, res as never, jest.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('falls back to a bad request when body-parser assigned no status', () => {
    const err = bodyParseError();
    delete err.status;
    const res = createRes();

    createErrorHandler(loggerMock)(err, req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
  });

  it('logs an unexpected exception once at error with the status it is actually sending', () => {
    // res.statusCode is still 200 when the handler runs, so logging it directly reported every
    // unhandled error as a success and misled anyone triaging from logs.
    const res = createRes();

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('(status: 500)'));
    expect(loggerMock.error).not.toHaveBeenCalledWith(expect.stringContaining('(status: 200)'));
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('keeps a status the handler set before failing', () => {
    // res.status(409) sets the code without sending headers. The client still receives 500 because
    // sendStatus overrides it, but the 409 says where the handler got to.
    const res = createRes();
    res.statusCode = 409;

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('(status: 500) (handler had set 409)')
    );
  });

  it('logs an explicit preset HTTP 500 at error', () => {
    const res = createRes();
    res.statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('(status: 500) (handler had set 500)')
    );
  });

  it.each([HttpStatusCodes.BAD_GATEWAY, HttpStatusCodes.SERVICE_UNAVAILABLE])(
    'logs an already-sent HTTP %s failure at error',
    (statusCode) => {
      const res = createRes();
      res.headersSent = true;
      res.statusCode = statusCode;

      createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

      expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining(`(status: ${statusCode})`));
      expect(loggerMock.warn).not.toHaveBeenCalled();
    }
  );

  it('logs the real status when headers were already sent', () => {
    const res = createRes();
    res.headersSent = true;
    res.statusCode = 206;

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('(status: 206)'));
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });

  it('does not treat an ordinary SyntaxError as a body parse failure', () => {
    const res = createRes();

    createErrorHandler(loggerMock)(new SyntaxError('boom'), req as never, res as never, jest.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });

  it('reports a user without the required role as forbidden', () => {
    const res = createRes();
    const err = new UnauthorizedUserError('update form definition roles', {
      id: 'tester',
      name: 'Tester',
    } as never);

    createErrorHandler(loggerMock)(err, req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
  });

  it('still reports recognized errors with their own status', () => {
    const res = createRes();

    createErrorHandler(loggerMock)(new NotFoundError('form definition', 'missing'), req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('reports an unrecognized error as a server error', () => {
    const res = createRes();

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });

  it('ends the response instead of setting a status when the headers are already sent', () => {
    const res = createRes();
    res.headersSent = true;

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });

  // The fixtures above stand in for body-parser's errors. This suite takes them out of the loop:
  // it drives a real express.json through supertest, so a change in what body-parser throws shows
  // up here rather than passing against a fixture that no longer matches reality.
  describe('with a real express.json body parser', () => {
    const createApp = () => {
      const app = express();
      app.use(express.json({ limit: '100b' }));
      app.post('/thing', (_req, res) => res.send('ok'));
      app.use(createErrorHandler(loggerMock));
      return app;
    };

    it('responds 413 to a body over the limit', async () => {
      const res = await request(createApp())
        .post('/thing')
        .set('content-type', 'application/json')
        .send({ value: 'x'.repeat(500) });

      expect(res.status).toBe(HttpStatusCodes.REQUEST_TOO_LONG);
      expect(res.body.errorMessage).toContain('size limit');
    });

    it('responds 400 to a malformed body', async () => {
      const res = await request(createApp())
        .post('/thing')
        .set('content-type', 'application/json')
        .send('{"value":}');

      expect(res.status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(res.body.errorMessage).toContain('Malformed request body');
    });
  });
});
