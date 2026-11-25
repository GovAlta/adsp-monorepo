import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { combinePdfConfiguration, configurationSchema } from './configuration';

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

  describe('combinePdfConfiguration', () => {
    it('uses the platform template when a tenant template has a platform template ID', () => {
      const tenant = { letter: { name: 'tenant letter' }, own: { name: 'own' } };
      const core = { letter: { name: 'platform letter' } };

      const [combined, platform] = combinePdfConfiguration(tenant, core);

      expect(combined).toEqual({ letter: { name: 'platform letter' }, own: { name: 'own' } });
      expect(platform).toBe(core);
    });

    it('returns empty platform templates when there is no core configuration', () => {
      const [combined, platform] = combinePdfConfiguration({ own: { name: 'own' } }, undefined);

      expect(combined).toEqual({ own: { name: 'own' } });
      expect(platform).toEqual({});
    });
  });
});
