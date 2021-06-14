import { adspId, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createLogEventJob } from './logEvent';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createLogEventJob', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const tokenProvider: TokenProvider = {
    getAccessToken: jest.fn(),
  };

  it('can create job', () => {
    const job = createLogEventJob({
      logger,
      tokenProvider,
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
        logger,
        tokenProvider,
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
        logger,
        tokenProvider,
        valueServiceUrl: new URL('http://totally-real-value-service'),
      });

      axiosMock.post.mockRejectedValueOnce(new Error('something has gone wrong'));
      job(event, (err) => {
        expect(err).toBeTruthy();
        done();
      });
    });
  });
});
