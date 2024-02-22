import axios, { InternalAxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as context from 'express-http-context';
import TraceParent = require('traceparent');
import { Logger } from 'winston';
import { getContextTrace as getContextTraceMocked } from './context';
import { createTraceHandler, traceRequestInterceptor } from './handler';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('express-http-context');
const contextMock = context as jest.Mocked<typeof context>;

jest.mock('./context');
const getContextTraceMock = getContextTraceMocked as jest.MockedFunction<typeof getContextTraceMocked>;

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

describe('handler', () => {
  beforeEach(() => {
    getContextTraceMock.mockClear();
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
          originalUrl: '/my-resource',
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

      it('can handle trace error', () => {
        const req = {
          headers: {},
        };
        const res = {};
        const next = jest.fn();
        contextMock.middleware.mockImplementationOnce((_req, _res, next) => next());
        contextMock.set.mockImplementationOnce(() => {
          throw new Error('oh noes!');
        });

        const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
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

  describe('traceRequestInterceptor', () => {
    it('can add traceparent header to request', () => {
      const trace = TraceParent.startOrResume(null, { transactionSampleRate: 5 });
      getContextTraceMock.mockReturnValueOnce(trace);

      const config = { headers: { has: jest.fn(), set: jest.fn() } };
      config.headers.has.mockReturnValueOnce(false);
      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig);
      expect(config.headers.set).toHaveBeenCalledWith('traceparent', trace.toString());
    });

    it('can passthrough original traceparent header', () => {
      const trace = TraceParent.startOrResume(null, { transactionSampleRate: 5 });
      getContextTraceMock.mockReturnValueOnce(trace);

      const config = { headers: { has: jest.fn(), set: jest.fn() } };
      config.headers.has.mockReturnValueOnce(true);
      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig);
      expect(config.headers.set).not.toHaveBeenCalled();
    });
  });
});
