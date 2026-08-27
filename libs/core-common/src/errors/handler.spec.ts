import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import * as HttpStatusCodes from 'http-status-codes';
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

  it('honours the status body-parser assigned, such as a payload that is too large', () => {
    const err = bodyParseError();
    err.status = HttpStatusCodes.REQUEST_TOO_LONG;
    const res = createRes();

    createErrorHandler(loggerMock)(err, req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.REQUEST_TOO_LONG);
  });

  it('falls back to a bad request when body-parser assigned no status', () => {
    const err = bodyParseError();
    delete err.status;
    const res = createRes();

    createErrorHandler(loggerMock)(err, req as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
  });

  it('logs the status it is actually sending, not the unset default', () => {
    // res.statusCode is still 200 when the handler runs, so logging it directly reported every
    // unhandled error as a success and misled anyone triaging from logs.
    const res = createRes();

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('(status: 500)'));
    expect(loggerMock.warn).not.toHaveBeenCalledWith(expect.stringContaining('(status: 200)'));
  });

  it('logs the real status when headers were already sent', () => {
    const res = createRes();
    res.headersSent = true;
    res.statusCode = 206;

    createErrorHandler(loggerMock)(new Error('boom'), req as never, res as never, jest.fn());

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('(status: 206)'));
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
});
