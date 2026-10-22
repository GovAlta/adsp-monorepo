import { AuditActionDefinition, AuditCategories, AuditSeverities } from '@abgov/adsp-service-sdk';
import { AjvValidationService } from '@core-services/core-common';
import { createLogger, transports } from 'winston';
import {
  ActionCatalog,
  combineCatalogs,
  configurationSchema,
  createCatalogConverter,
  AuditConfiguration,
  combineAuditConfiguration,
  createAuditConfigurationConverter,
  createConfigurationSchema,
} from './configuration';

const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
const definition: AuditActionDefinition = {
  version: 1,
  category: 'administrative',
  severity: 'info',
  retentionClass: 'compliance',
};
const catalog: ActionCatalog = {
  kind: 'actionCatalog',
  application: 'case-service',
  actions: { 'case.update': definition },
};

describe('audit configuration schema', () => {
  const validation = new AjvValidationService(logger);
  validation.setSchema('audit-service', configurationSchema);
  const validate = (value: unknown) => validation.validate('audit configuration', 'audit-service', value);

  it('accepts the complete action definition', () => {
    const action = {
      ...definition,
      resourceType: 'case',
      captureChangeSet: true,
      forwardToSiem: true,
      metadataSchema: { type: 'object', properties: { reference: { type: 'string' } } },
    };

    expect(() => validate({ ...catalog, actions: { 'case.update': action } })).not.toThrow();
  });

  it.each(Object.values(AuditCategories))('accepts SDK category %s', (category) => {
    expect(() =>
      validate({
        ...catalog,
        actions: { 'case.update': { ...definition, category } },
      }),
    ).not.toThrow();
  });

  it.each(Object.values(AuditSeverities))('accepts SDK severity %s', (severity) => {
    expect(() =>
      validate({
        ...catalog,
        actions: { 'case.update': { ...definition, severity } },
      }),
    ).not.toThrow();
  });

  describe('combined audit configuration', () => {
    const convert = createAuditConfigurationConverter(logger);

    it.each<AuditConfiguration>([
      { kind: 'retentionSettings', classes: { standard: { days: 120 } } },
      { kind: 'applicationRetentionSettings', application: 'case-service', classes: { compliance: { days: 730 } } },
    ])('converts retention document $kind', (value) => {
      expect(convert(value)).toEqual(value);
    });

    it('keeps Core precedence for action definitions', () => {
      const core: ActionCatalog = { ...catalog, actions: { 'case.update': { ...definition, version: 2 } } };

      expect(combineAuditConfiguration(catalog, core)).toEqual(core);
    });

    it('overrides Core retention periods by class with tenant settings', () => {
      const result = combineAuditConfiguration(
        { kind: 'retentionSettings', classes: { standard: { days: 120 } } },
        { kind: 'retentionSettings', classes: { standard: { days: 90 }, security: { days: 365 } } },
      );

      expect(result).toEqual({
        kind: 'retentionSettings',
        classes: { standard: { days: 120 }, security: { days: 365 } },
      });
    });

    it.each<[AuditConfiguration | null, AuditConfiguration | null]>([
      [null, null],
      [null, { kind: 'retentionSettings', classes: {} }],
      [{ kind: 'retentionSettings', classes: {} }, null],
    ])('preserves missing scopes %#', (tenant, core) => {
      expect(combineAuditConfiguration(tenant, core)).toEqual(tenant || core);
    });

    it('rejects documents with different kinds', () => {
      expect(() => combineAuditConfiguration(catalog, { kind: 'retentionSettings', classes: {} })).toThrow(
        'different kinds',
      );
    });

    it('rejects application overrides belonging to different namespaces', () => {
      expect(() =>
        combineAuditConfiguration(
          { kind: 'applicationRetentionSettings', application: 'case-service', classes: {} },
          { kind: 'applicationRetentionSettings', application: 'payment-service', classes: {} },
        ),
      ).toThrow('different applications');
    });
  });

  it.each(['version', 'category', 'severity', 'retentionClass'])('rejects missing %s', (field) => {
    const action = { ...definition };
    delete action[field];

    expect(() => validate({ ...catalog, actions: { 'case.update': action } })).toThrow(field);
  });

  it.each([
    { version: 0 },
    { version: 1.5 },
    { category: 'unknown' },
    { severity: 'fatal' },
    { retentionClass: '' },
    { retentionClass: 365 },
    { captureChangeSet: 'true' },
    { forwardToSiem: 'false' },
    { unexpected: true },
    { metadataSchema: { type: 'invalid' } },
  ])('rejects invalid definition fields %j', (fields) => {
    expect(() => validate({ ...catalog, actions: { 'case.update': { ...definition, ...fields } } })).toThrow();
  });

  it('allows custom retention class names', () => {
    expect(() =>
      validate({
        ...catalog,
        actions: { 'case.update': { ...definition, retentionClass: 'case-history' } },
      }),
    ).not.toThrow();
  });

  it.each([
    { kind: 'retentionSettings', classes: { standard: { days: 1 } } },
    { kind: 'retentionSettings', classes: { standard: { days: 3650 } } },
    { kind: 'retentionSettings', classes: { standard: { days: 365 } } },
    { kind: 'applicationRetentionSettings', application: 'case-service', classes: {} },
    { ...catalog, actions: {} },
    { ...catalog, application: 'a'.repeat(40) },
  ])('preserves valid namespace document shapes %j', (value) => {
    expect(() => validate(value)).not.toThrow();
  });

  it.each([
    { ...catalog, application: 'a'.repeat(41) },
    { ...catalog, application: 'case service' },
    { kind: 'retentionSettings', classes: { standard: { days: 0 } } },
    { kind: 'retentionSettings', classes: { standard: { days: -1 } } },
    { kind: 'retentionSettings', classes: { standard: { days: 0.5 } } },
    { kind: 'retentionSettings', classes: { standard: { days: '365' } } },
    { kind: 'retentionSettings', classes: { standard: { days: 3651 } } },
    { kind: 'applicationRetentionSettings', application: 'case-service', classes: { custom: { days: 3651 } } },
    { ...catalog, extra: true },
  ])('rejects malformed documents %j', (value) => {
    expect(() => validate(value)).toThrow();
  });
});

describe('deployment retention bounds', () => {
  it.each([30, 730])('accepts inclusive configured boundary %i', (days) => {
    const validation = new AjvValidationService(logger);
    validation.setSchema('bounded', createConfigurationSchema({ minDays: 30, maxDays: 730 }));

    expect(() =>
      validation.validate('retention', 'bounded', {
        kind: 'retentionSettings',
        classes: { custom: { days } },
      }),
    ).not.toThrow();
  });

  it.each([29, 731])('refuses periods outside configured boundaries: %i', (days) => {
    const validation = new AjvValidationService(logger);
    validation.setSchema('bounded', createConfigurationSchema({ minDays: 30, maxDays: 730 }));

    expect(() =>
      validation.validate('retention', 'bounded', {
        kind: 'applicationRetentionSettings',
        application: 'case-service',
        classes: { custom: { days } },
      }),
    ).toThrow();
  });

  it.each([
    { minDays: 0, maxDays: 3650 },
    { minDays: 30, maxDays: 29 },
    { minDays: 1.5, maxDays: 3650 },
    { minDays: 1, maxDays: Infinity },
  ])('refuses invalid platform bounds %j', (bounds) => {
    expect(() => createConfigurationSchema(bounds)).toThrow('Retention bounds');
  });

  it('preserves old positive periods for explicit runtime rejection instead of SDK missing-config fallback', () => {
    const value = { kind: 'retentionSettings', classes: { standard: { days: 4000 } } };

    expect(createAuditConfigurationConverter(logger)(value)).toEqual(value);
  });
});

describe('catalog conversion and merge', () => {
  const convert = createCatalogConverter(logger);

  it.each([null, undefined, {}])('reports an absent configuration as unregistered (%j)', (value) => {
    expect(convert(value)).toBeNull();
  });

  it('keeps a registered empty catalog distinct from missing', () => {
    expect(convert({ ...catalog, actions: {} })).toEqual({ ...catalog, actions: {} });
  });

  it('applies boolean defaults without modifying the source', () => {
    const result = convert(catalog);

    expect(result.actions['case.update']).toEqual({ ...definition, captureChangeSet: false, forwardToSiem: false });
    expect(catalog.actions['case.update']).toEqual(definition);
  });

  it('does not treat invalid configuration as missing', () => {
    expect(() => convert({ ...catalog, kind: 'retentionSettings' })).toThrow();
  });

  it('gives core precedence by action while keeping tenant-only actions', () => {
    const core = { ...catalog, actions: { 'case.update': { ...definition, version: 2 } } };
    const tenant = { ...catalog, actions: { ...catalog.actions, 'case.create': definition } };

    expect(combineCatalogs(tenant, core).actions).toEqual({
      'case.update': { ...definition, version: 2 },
      'case.create': definition,
    });
  });

  it('exposes core catalogs without a tenant override', () => {
    expect(combineCatalogs(null, catalog)).toEqual(catalog);
  });

  it('does not resurrect actions removed from the tenant catalog', () => {
    expect(combineCatalogs({ ...catalog, actions: {} }, null).actions).toEqual({});
  });

  it('returns unregistered only when both documents are absent', () => {
    expect(combineCatalogs(null, null)).toBeNull();
  });

  it('rejects mixing applications', () => {
    expect(() => combineCatalogs(catalog, { ...catalog, application: 'payment-service' })).toThrow();
  });
});
