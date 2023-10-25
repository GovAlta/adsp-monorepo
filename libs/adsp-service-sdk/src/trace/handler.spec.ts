import axios from 'axios';
import { Request, Response } from 'express';
import * as context from 'express-http-context';
import TraceParent = require('traceparent');
import { Logger } from 'winston';
import { createTraceHandler, getContextTrace } from './handler';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('express-http-context');
const contextMock = context as jest.Mocked<typeof context>;

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

describe('handler', () => {
  describe('getContextTrace', () => {
    it('can get context trace', () => {
      const trace = TraceParent.startOrResume(null, { transactionSampleRate: 0 });
      contextMock.get.mockReturnValueOnce(trace);

      const result = getContextTrace();
      expect(result).toBe(trace);
    });

    it('can return null for no context trace', () => {
      contextMock.get.mockReturnValueOnce(null);

      const result = getContextTrace();
      expect(result).toBeNull();
    });

    it('can get context trace', () => {
      const trace = 'not a traceparent';
      contextMock.get.mockReturnValueOnce(trace);

      const result = getContextTrace();
      expect(result).toBe(null);
    });
  });

  describe('createTraceHandler', () => {
    beforeEach(() => {
      contextMock.set.mockClear();
    });

    it('can create handler', () => {
      const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
      expect(handler).toBeTruthy();
      expect(axiosMock.interceptors.request.use).toHaveBeenCalled();
    });

    describe('handler', () => {
      it('can handle request by adding trace context', () => {
        const req = {
          headers: {},
        };
        const res = {};
        const next = jest.fn();
        contextMock.middleware.mockImplementationOnce((_req, _res, next) => next());

        const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(undefined);
        expect(contextMock.set).toHaveBeenCalledWith('adsp_traceparent', expect.any(TraceParent));
      });

      it('can handle request by resuming trace context', () => {
        const req = {
          headers: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' },
        };
        const res = {};
        const next = jest.fn();
        contextMock.middleware.mockImplementationOnce((_req, _res, next) => next());

        const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(undefined);
        expect(contextMock.set).toHaveBeenCalledWith(
          'adsp_traceparent',
          expect.objectContaining({
            version: '00',
            traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
            parentId: '00f067aa0ba902b7',
            flags: '01',
            recorded: true,
          })
        );
      });

      it('can passthrough error', () => {
        const req = {
          headers: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' },
        };
        const res = {};
        const next = jest.fn();
        const err = new Error('oh noes!');
        contextMock.middleware.mockImplementationOnce((_req, _res, next) => next(err));

        const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(err);
        expect(contextMock.set).not.toHaveBeenCalled();
      });
    });
  });
});
