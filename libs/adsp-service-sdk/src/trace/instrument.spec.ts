import axios from 'axios';
import { context as otelContext, propagation, trace as otelTrace, SpanStatusCode } from '@opentelemetry/api';
import { Logger } from 'winston';
import { createHttpServerTraceHandler, instrumentAxios } from './instrument';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('instrument', () => {
  const logger = {
    debug: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('instrumentAxios', () => {
    it('can record request timing with trace header', () => {
      instrumentAxios(logger);

      const requestUse = axiosMock.interceptors.request.use as unknown as jest.Mock;
      const responseUse = axiosMock.interceptors.response.use as unknown as jest.Mock;
      const onRequest = requestUse.mock.calls[0][0] as (config: unknown) => unknown;
      const onResponse = responseUse.mock.calls[0][0] as (response: unknown) => unknown;

      const config = {
        url: 'https://example.com/test',
        headers: {
          get: jest.fn().mockReturnValue('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'),
        },
      };

      const trackedConfig = onRequest(config);
      const response = { config: trackedConfig };
      const result = onResponse(response);

      expect(result).toBe(response);
    });
  });

  describe('createHttpServerTraceHandler', () => {
    it('can create span and complete it on json response', () => {
      const span = {
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
        isRecording: jest.fn().mockReturnValue(false),
        recordException: jest.fn(),
      };
      const startSpan = jest.fn().mockReturnValue(span);
      const tracerProvider = {
        getTracer: jest.fn().mockReturnValue({ startSpan }),
      };

      const extractSpy = jest.spyOn(propagation, 'extract').mockReturnValue({} as never);
      const withSpy = jest.spyOn(otelContext, 'with').mockImplementation((_ctx, fn) => fn());
      const setSpanSpy = jest.spyOn(otelTrace, 'setSpan').mockReturnValue({} as never);

      const handler = createHttpServerTraceHandler(tracerProvider as never);
      const listeners: Record<string, (arg?: unknown) => void> = {};
      const req = {
        method: 'GET',
        route: { path: '/resource' },
        path: '/resource',
        originalUrl: '/resource?a=1',
        hostname: 'localhost',
        protocol: 'http',
        httpVersion: '1.1',
        ip: '127.0.0.1',
        headers: {},
        get: jest.fn().mockReturnValue('jest-agent'),
      };
      const res = {
        statusCode: 200,
        json: jest.fn(function (body) {
          return body;
        }),
        send: jest.fn(function (body) {
          return body;
        }),
        on: jest.fn((event: string, cb: (arg?: unknown) => void) => {
          listeners[event] = cb;
          return res;
        }),
      };
      const next = jest.fn();

      handler(req as never, res as never, next);
      expect(extractSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();

      (res.json as (body: unknown) => unknown)({ ok: true });

      expect(span.setAttributes).toHaveBeenCalledWith({ 'http.status_code': 200 });
      expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(span.end).toHaveBeenCalled();

      extractSpy.mockRestore();
      withSpy.mockRestore();
      setSpanSpy.mockRestore();
    });

    it('can record errors and finish completion', () => {
      const span = {
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
        isRecording: jest.fn().mockReturnValue(true),
        recordException: jest.fn(),
      };

      const tracerProvider = {
        getTracer: jest.fn().mockReturnValue({ startSpan: jest.fn().mockReturnValue(span) }),
      };
      const withSpy = jest.spyOn(otelContext, 'with').mockImplementation((_ctx, fn) => fn());
      const setSpanSpy = jest.spyOn(otelTrace, 'setSpan').mockReturnValue({} as never);
      jest.spyOn(propagation, 'extract').mockReturnValue({} as never);

      const handler = createHttpServerTraceHandler(tracerProvider as never);
      const listeners: Record<string, (arg?: unknown) => void> = {};
      const req = {
        method: 'POST',
        path: '/resource',
        originalUrl: '/resource',
        hostname: 'localhost',
        protocol: 'http',
        httpVersion: '1.1',
        ip: '127.0.0.1',
        headers: {},
        get: jest.fn().mockReturnValue('jest-agent'),
      };
      const res = {
        statusCode: 500,
        json: jest.fn(function (body) {
          return body;
        }),
        send: jest.fn(function (body) {
          return body;
        }),
        on: jest.fn((event: string, cb: (arg?: unknown) => void) => {
          listeners[event] = cb;
          return res;
        }),
      };
      const next = jest.fn();

      handler(req as never, res as never, next);
      listeners.error(new Error('response error'));
      listeners.finish();

      expect(span.recordException).toHaveBeenCalled();
      expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
      expect(span.end).toHaveBeenCalled();

      withSpy.mockRestore();
      setSpanSpy.mockRestore();
    });
  });
});
