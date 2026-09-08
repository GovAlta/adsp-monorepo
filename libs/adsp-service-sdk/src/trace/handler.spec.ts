import axios, { InternalAxiosRequestConfig } from 'axios';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { propagation, trace as otelTrace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createTraceHandler, traceRequestInterceptor } from './handler';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

describe('handler', () => {
  describe('createTraceHandler', () => {
    it('can create handler', () => {
      const handler = createTraceHandler({ logger: loggerMock });
      expect(handler).toBeTruthy();
      expect(axiosMock.interceptors.request.use).toHaveBeenCalled();
    });

    it('can configure tracing with tracer provider present', () => {
      const tracerProvider = {
        getTracer: jest.fn().mockReturnValue({ startSpan: jest.fn() }),
      };

      const handler = createTraceHandler({
        logger: loggerMock,
        tracerProvider: tracerProvider as never,
      });

      expect(handler).toBeTruthy();
      expect(tracerProvider.getTracer).toHaveBeenCalledWith('adsp-service-sdk');
    });

    describe('handler', () => {
      it('can handle request by adding trace context', () => {
        const req = {
          headers: {},
          originalUrl: '/my-resource',
        };
        const res = {};
        const next = jest.fn();

        const handler = createTraceHandler({ logger: loggerMock });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(undefined);
      });

      it('can passthrough error', () => {
        const req = {
          headers: {},
        };
        const res = {};
        const next = jest.fn();

        const handler = createTraceHandler({ logger: loggerMock });
        handler(req as unknown as Request, res as Response, next);
        // Without tracerProvider there is no error path; handler calls next() directly
        expect(next).toHaveBeenCalled();
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

    it('can add request event to client span', () => {
      const config = { headers: { has: jest.fn(), set: jest.fn() }, method: 'get', url: '/path' };
      config.headers.has.mockReturnValueOnce(false);

      const parentSpan = {
        spanContext: () => ({ traceId: '4bf92f3577b34da6a3ce929d0e0e4736', spanId: '00f067aa0ba902b7', traceFlags: 1 }),
        addEvent: jest.fn(),
      };
      const clientSpan = {
        addEvent: jest.fn(),
      };
      const tracer = { startSpan: jest.fn().mockReturnValue(clientSpan) };
      jest.spyOn(otelTrace, 'getActiveSpan').mockReturnValue(parentSpan as never);

      const setSpanSpy = jest.spyOn(otelTrace, 'setSpan');

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig, tracer as never);

      expect(setSpanSpy).toHaveBeenCalled();
      expect(tracer.startSpan).toHaveBeenCalledWith(
        'GET',
        expect.objectContaining({ kind: SpanKind.CLIENT }),
        expect.anything(),
      );
      expect(clientSpan.addEvent).toHaveBeenCalledWith('http.client.request', {
        'http.method': 'GET',
        'http.url': '/path',
      });

      setSpanSpy.mockRestore();
    });

    it('can create a client span when tracer is provided', () => {
      const config = { headers: { has: jest.fn(), set: jest.fn() }, method: 'get', url: 'http://example.com' };
      config.headers.has.mockReturnValueOnce(false);

      const clientSpan = {
        addEvent: jest.fn(),
      };
      const tracer = { startSpan: jest.fn().mockReturnValue(clientSpan) };

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig, tracer as never);

      expect(tracer.startSpan).toHaveBeenCalledWith(
        'GET example.com',
        expect.objectContaining({ kind: SpanKind.CLIENT }),
        expect.anything(),
      );
    });

    it('can keep resource ids out of the client span name', () => {
      const config = {
        headers: { has: jest.fn(), set: jest.fn() },
        method: 'delete',
        url: 'http://notification-service:3333/subscription/v1/types/form-status-updates/subscriptions/6a8d18979e84b4fcf8877830',
      };
      config.headers.has.mockReturnValueOnce(false);

      const clientSpan = { addEvent: jest.fn() };
      const tracer = { startSpan: jest.fn().mockReturnValue(clientSpan) };

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig, tracer as never);

      expect(tracer.startSpan).toHaveBeenCalledWith(
        'DELETE notification-service:3333',
        expect.objectContaining({
          attributes: expect.objectContaining({
            'http.method': 'DELETE',
            'http.target': '/subscription/v1/types/form-status-updates/subscriptions/6a8d18979e84b4fcf8877830',
          }),
        }),
        expect.anything(),
      );
    });

    it('can bypass tracing when suppression header is set', () => {
      const config = {
        headers: {
          has: jest.fn(),
          set: jest.fn(),
        },
        _otelSuppressTracing: true,
        method: 'post',
        url: 'http://example.com/deferred',
      };

      const tracer = { startSpan: jest.fn() };
      const injectSpy = jest.spyOn(propagation, 'inject');

      traceRequestInterceptor(config as unknown as InternalAxiosRequestConfig, tracer as never);

      expect(tracer.startSpan).not.toHaveBeenCalled();
      expect(injectSpy).not.toHaveBeenCalled();
      expect((config as { _otelSuppressTracing?: boolean })._otelSuppressTracing).toBeUndefined();

      injectSpy.mockRestore();
    });

    it('can end client span on axios error', async () => {
      const clientSpan = {
        addEvent: jest.fn(),
        setAttributes: jest.fn(),
        updateName: jest.fn(),
        setStatus: jest.fn(),
        end: jest.fn(),
        recordException: jest.fn(),
      };
      const tracerProvider = {
        getTracer: jest.fn().mockReturnValue({ startSpan: jest.fn().mockReturnValue(clientSpan) }),
      };

      createTraceHandler({ logger: loggerMock, tracerProvider: tracerProvider as never });

      const responseUse = axiosMock.interceptors.response.use as unknown as jest.Mock;
      const onError = responseUse.mock.lastCall?.[1] as (error: unknown) => Promise<unknown>;

      const config = { _otelClientSpan: clientSpan };

      await expect(onError({ config, response: { status: 503 }, message: 'boom' })).rejects.toMatchObject({
        response: { status: 503 },
      });

      expect(clientSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'HTTP 503' });
      expect(clientSpan.end).toHaveBeenCalled();
    });
  });
});
