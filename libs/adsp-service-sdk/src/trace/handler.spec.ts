import axios from 'axios';
import * as context from 'express-http-context';
import { createTraceHandler, getContextTrace } from './handler';
import TraceParent = require('traceparent');
import { Request, Response } from 'express';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('express-http-context');
const contextMock = context as jest.Mocked<typeof context>;

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
      const handler = createTraceHandler({ sampleRate: 0 });
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

        const handler = createTraceHandler({ sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(contextMock.set).toHaveBeenCalledWith('adsp_traceparent', expect.any(TraceParent));
      });

      it('can handle request by resuming trace context', () => {
        const req = {
          headers: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' },
        };
        const res = {};
        const next = jest.fn();

        const handler = createTraceHandler({ sampleRate: 0 });
        handler(req as unknown as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
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
    });
  });
});
