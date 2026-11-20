import { adspId } from '@abgov/adsp-service-sdk';
import { combineConfiguration, ExportServiceConfiguration } from './configuration';

describe('ExportServiceConfiguration', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const formResource = adspId`urn:ads:platform:form-service:v1:/forms`;
  const tenantResource = adspId`urn:ads:test:my-service:v1:/things`;

  describe('combineConfiguration', () => {
    it('can merge tenant sources with platform sources', () => {
      const configuration = combineConfiguration(
        { sources: { 'urn:ads:test:my-service': { exporterRoles: ['tenant-exporter'] } } },
        { sources: { 'urn:ads:platform:form-service': { exporterRoles: ['form-admin'] } } },
        tenantId,
      );

      expect(configuration).toBeInstanceOf(ExportServiceConfiguration);
      expect(configuration.tenantId).toBe(tenantId);
      expect(configuration.getSource(tenantResource)).toEqual({ exporterRoles: ['tenant-exporter'] });
      expect(configuration.getSource(formResource)).toEqual({ exporterRoles: ['form-admin'] });
    });

    it('uses the platform source for the same key', () => {
      const configuration = combineConfiguration(
        { sources: { 'urn:ads:platform:form-service': { exporterRoles: ['tenant-role'] } } },
        { sources: { 'urn:ads:platform:form-service': { exporterRoles: ['form-admin'] } } },
        tenantId,
      );

      expect(configuration.getSource(formResource)).toEqual({ exporterRoles: ['form-admin'] });
    });

    it('can handle missing configuration', () => {
      const configuration = combineConfiguration(undefined, undefined, tenantId);
      expect(configuration.getSource(formResource)).toBeUndefined();
    });

    it('can handle configuration without sources', () => {
      const configuration = combineConfiguration({} as never, { sources: { 'urn:ads:test:my-service': { exporterRoles: [] } } }, tenantId);
      expect(configuration.getSource(tenantResource)).toEqual({ exporterRoles: [] });
    });
  });

  describe('getSource', () => {
    it('prefers the API source over the service source', () => {
      const configuration = new ExportServiceConfiguration(
        {
          sources: {
            'urn:ads:test:my-service': { exporterRoles: ['service'] },
            'urn:ads:test:my-service:v1': { exporterRoles: ['api'] },
          },
        },
        tenantId,
      );
      expect(configuration.getSource(tenantResource)).toEqual({ exporterRoles: ['api'] });
    });

    it('returns undefined for a non-resource id', () => {
      const configuration = new ExportServiceConfiguration(
        { sources: { 'urn:ads:test:my-service': { exporterRoles: [] } } },
        tenantId,
      );
      expect(configuration.getSource(adspId`urn:ads:test:my-service`)).toBeUndefined();
    });
  });
});
