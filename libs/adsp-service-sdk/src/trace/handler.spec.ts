import axios, { InternalAxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import * as context from 'express-http-context';
import { Logger } from 'winston';
import { context as otelContext, propagation, trace as otelTrace } from '@opentelemetry/api';
import { createTraceHandler, traceRequestInterceptor } from './handler';

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
  describe('createTraceHandler', () => {
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
      });

      it('can passthrough error', () => {
        const req = {
          headers: {},
        };
        const res = {};
        const next = jest.fn();
        const err = new Error('oh noes!');
        contextMock.middleware.mockImplementationOnce((_req, _res, next) => next(err));

        const handler = createTraceHandler({ logger: loggerMock, sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(err);
      });
    });
  });

  describe('traceRequestInterceptor', () => {
    it('can inject traceparent header to request', () => {
      const config = { headers: { has: jest.fn(), set: jest.fn() } };
      config.headers.has.mockReturnValueOnce(false);

      const injectSpy = jest.spyOn(propagation, 'inject').mockImplementation((_ctx, _carrier, setter) => {
        setter.set(config.headers as unknown as Record<string, unknown>, 'traceparent', 'trace-value');
      });

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig);

      expect(injectSpy).toHaveBeenCalled();
      expect(config.headers.set).toHaveBeenCalledWith('traceparent', 'trace-value');
      injectSpy.mockRestore();
    });

    it('can passthrough original traceparent header', () => {
      const config = { headers: { has: jest.fn(), set: jest.fn() } };
      config.headers.has.mockReturnValueOnce(true);

      const injectSpy = jest.spyOn(propagation, 'inject');
      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig);

      expect(injectSpy).not.toHaveBeenCalled();
      expect(config.headers.set).not.toHaveBeenCalled();
      injectSpy.mockRestore();
    });

    it('can add request event to active span', () => {
      const config = { headers: { has: jest.fn(), set: jest.fn() }, method: 'get', url: '/path' };
      config.headers.has.mockReturnValueOnce(false);

      const span = {
        spanContext: () => ({ traceId: '4bf92f3577b34da6a3ce929d0e0e4736', spanId: '00f067aa0ba902b7', traceFlags: 1 }),
        addEvent: jest.fn(),
      };
      contextMock.get.mockReturnValue(span);

      const withSpy = jest.spyOn(otelContext, 'with');
      const setSpanSpy = jest.spyOn(otelTrace, 'setSpan');
      const getActiveSpanSpy = jest.spyOn(otelTrace, 'getActiveSpan').mockReturnValue(span as unknown as never);

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig);

      expect(setSpanSpy).toHaveBeenCalled();
      expect(withSpy).toHaveBeenCalled();
      expect(getActiveSpanSpy).toHaveBeenCalled();
      expect(span.addEvent).toHaveBeenCalledWith('http.client.request', {
        'http.method': 'get',
        'http.url': '/path',
      });

      withSpy.mockRestore();
      setSpanSpy.mockRestore();
      getActiveSpanSpy.mockRestore();
    });
  });
});
