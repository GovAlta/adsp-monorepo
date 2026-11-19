import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { adspId } from '@abgov/adsp-service-sdk';
import { configurationSchema, convertConfiguration } from './configuration';
import { QueueEntity } from './model';

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

  describe('convertConfiguration', () => {
    const queue = { namespace: 'support', name: 'intake', context: {}, workerRoles: [], assignerRoles: [] };

    it('sets the configuration tenant on each queue', () => {
      const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
      const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
      const configA = convertConfiguration(
        { queues: { 'support:intake': { ...queue, tenantId: undefined } } },
        tenantA,
      );
      const configB = convertConfiguration(
        { queues: { 'support:intake': { ...queue, tenantId: undefined } } },
        tenantB,
      );

      expect(configA.queues['support:intake']).toBeInstanceOf(QueueEntity);
      expect(configA.queues['support:intake'].tenantId).toBe(tenantA);
      expect(configB.queues['support:intake'].tenantId).toBe(tenantB);
    });

    it('returns no queues for empty configuration', () => {
      expect(convertConfiguration({})).toEqual({ queues: {} });
    });
  });
});
