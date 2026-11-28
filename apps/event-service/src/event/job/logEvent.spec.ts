import { adspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createLogEventJob } from './logEvent';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createLogEventJob', () => {
  const serviceId = adspId`urn:ads:platform:event-service`;
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProvider: TokenProvider = {
    getAccessToken: jest.fn(),
  };

  const configurationService = {
    getConfiguration: jest.fn(() => Promise.resolve({})),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
  });

  it('can create job', () => {
    const job = createLogEventJob({
      serviceId,
      logger,
      tokenProvider,
      configurationService: configurationService as unknown as ConfigurationService,
      valueServiceUrl: new URL('http://totally-real-value-service'),
    });
    expect(job).toBeTruthy();
  });

  describe('logEventJob', () => {
    const event = {
      namespace: 'test',
      name: 'test-started',
      timestamp: new Date(),
      context: {
        value: 'a',
      },
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      correlationId: 'urn:ads:platform:file-service:v1:/files/123',
      payload: {},
      traceparent: '123',
    };

    it('can handle event', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        done(err);
      });
    });

    it('preserves retry signaling when the primary event write fails', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      const writeError = new Error('something has gone wrong');
      axiosMock.post.mockRejectedValueOnce(writeError);
      job(event, (err) => {
        expect(err).toBe(writeError);
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
        done();
      });
    });

    it('can skip event based on definition', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              log: { skip: true },
            },
          },
        },
      });

      const start = new Date(event.timestamp.getTime() - 30000);
      axiosMock.get.mockResolvedValueOnce({
        data: { 'event-service': { event: [{ timestamp: start.toISOString() }] } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.post).not.toHaveBeenCalled();
        done(err);
      });
    });

    it('can compute interval duration metric', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              interval: {
                metric: 'test',
                namespace: 'test',
                name: 'test-prepared',
              },
            },
          },
        },
      });

      const start = new Date(event.timestamp.getTime() - 30000);
      axiosMock.get.mockResolvedValueOnce({
        data: { 'event-service': { event: [{ timestamp: start.toISOString() }] } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ namespace: 'test', name: 'test-prepared' })),
          expect.any(Object),
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object),
        );
        done(err);
      });
    });

    it('can compute interval duration metric with array context criteria', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              interval: {
                metric: 'test',
                namespace: 'test',
                name: 'test-prepared',
                context: ['value'],
              },
            },
          },
        },
      });

      const start = new Date(event.timestamp.getTime() - 30000);
      axiosMock.get.mockResolvedValueOnce({
        data: { 'event-service': { event: [{ timestamp: start.toISOString() }] } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ value: 'a', namespace: 'test', name: 'test-prepared' })),
          expect.any(Object),
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object),
        );
        done(err);
      });
    });

    it('can compute interval duration metric with string context criteria', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              interval: {
                metric: 'test',
                namespace: 'test',
                name: 'test-prepared',
                context: 'value',
              },
            },
          },
        },
      });

      const start = new Date(event.timestamp.getTime() - 30000);
      axiosMock.get.mockResolvedValueOnce({
        data: { 'event-service': { event: [{ timestamp: start.toISOString() }] } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ value: 'a', namespace: 'test', name: 'test-prepared' })),
          expect.any(Object),
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object),
        );
        done(err);
      });
    });

    it('can skip duration metric for no event definition', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce([
        {
          test: {},
        },
      ]);

      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledTimes(0);
        done(err);
      });
    });

    it('can skip duration metric for no interval configuration', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce([
        {
          test: {
            definitions: {
              'test-started': {},
            },
          },
        },
      ]);

      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledTimes(0);
        done(err);
      });
    });

    it('logs one error for an interval read failure and still writes and acknowledges the event', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              interval: {
                metric: 'test',
                namespace: 'test',
                name: 'test-prepared',
              },
            },
          },
        },
      });

      const intervalError = new Error('Something went terribly wrong.');
      axiosMock.get.mockRejectedValueOnce(intervalError);
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(err).toBeUndefined();
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            metrics: {
              'total:count': 1,
              'test:test-started:count': 1,
            },
          }),
          expect.any(Object),
        );
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          `Error encountered computing duration for event test:test-started ` +
            `(correlation ID: ${event.correlationId}) interval. ${intervalError}`,
          { context: 'EventLog', tenantId: event.tenantId.toString() },
        );
        done();
      });
    });

    it('does not log an error when no historical interval event exists', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      configurationService.getConfiguration.mockResolvedValueOnce({
        test: {
          definitions: {
            'test-started': {
              interval: {
                metric: 'test',
                namespace: 'test',
                name: 'test-prepared',
              },
            },
          },
        },
      });
      axiosMock.get.mockResolvedValueOnce({ data: {} });
      axiosMock.post.mockResolvedValueOnce({});

      job(event, (err) => {
        expect(err).toBeUndefined();
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
