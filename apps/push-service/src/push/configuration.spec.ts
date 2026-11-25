import { adspId } from '@abgov/adsp-service-sdk';
import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { combinePushConfiguration, configurationSchema } from './configuration';

describe('configuration', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('configuration', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'configuration', configurationSchema);
  });

  it('treats null webhooks as no configured webhooks', () => {
    const combined = combinePushConfiguration(
      { webhooks: null },
      { webhooks: null },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      logger as unknown as Logger,
    );

    expect(combined).toEqual({ webhooks: {} });
  });
});
