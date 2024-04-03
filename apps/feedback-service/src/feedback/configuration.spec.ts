import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { combineConfiguration, configurationSchema } from './configuration';

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

  describe('combineConfiguration', () => {
    it('can map configuration', () => {
      const result = combineConfiguration({ sites: [{ url: 'http://test.org', views: [] }] });
      expect(result.sites['http://test.org']).toMatchObject({
        url: expect.any(URL),
        views: expect.arrayContaining([]),
      });
    });

    it('can handle incomplete configuration', () => {
      let result = combineConfiguration({});
      expect(result.sites).toBeTruthy();

      result = combineConfiguration(null);
      expect(result.sites).toBeTruthy();
    });
  });
});
