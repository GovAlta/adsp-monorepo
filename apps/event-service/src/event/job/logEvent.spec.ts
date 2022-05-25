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
  };

  beforeEach(() => {
    configurationService.getConfiguration.mockClear();
    axiosMock.get.mockClear();
    axiosMock.post.mockClear();
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

    it('can handle error on post event', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      axiosMock.post.mockRejectedValueOnce(new Error('something has gone wrong'));
      job(event, (err) => {
        expect(err).toBeTruthy();
        done();
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
      axiosMock.get.mockResolvedValueOnce({
        data: { page: { size: 0 } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ namespace: 'test', name: 'test-prepared' })),
          expect.any(Object)
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object)
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
      axiosMock.get.mockResolvedValueOnce({
        data: { page: { size: 0 } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ value: 'a', namespace: 'test', name: 'test-prepared' })),
          expect.any(Object)
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object)
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
      axiosMock.get.mockResolvedValueOnce({
        data: { page: { size: 0 } },
      });
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.get).toHaveBeenCalledWith(
          expect.stringContaining(JSON.stringify({ value: 'a', namespace: 'test', name: 'test-prepared' })),
          expect.any(Object)
        );
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ metrics: expect.objectContaining({ 'test:duration': 30 }) }),
          expect.any(Object)
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

    it('can handle interval error and log event', (done) => {
      const job = createLogEventJob({
        serviceId,
        logger,
        tokenProvider,
        configurationService: configurationService as unknown as ConfigurationService,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      axiosMock.get.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
      axiosMock.post.mockResolvedValueOnce({});
      job(event, (err) => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        done(err);
      });
    });
  });
});
