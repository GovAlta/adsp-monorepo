import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { AjvValidationService } from '@core-services/core-common';
import type { Logger } from 'winston';

export const APPLICATION_PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
export const APPLICATION_MAX_LENGTH = 40;

export interface ActionCatalog {
  kind: 'actionCatalog';
  application: string;
  actions: Record<string, AuditActionDefinition>;
}

export interface RetentionSettings {
  kind: 'retentionSettings';
  classes: Record<string, { days: number }>;
}

export interface ApplicationRetentionSettings {
  kind: 'applicationRetentionSettings';
  application: string;
  classes: Record<string, { days: number }>;
}

export type AuditConfiguration = ActionCatalog | RetentionSettings | ApplicationRetentionSettings;

export interface RetentionBounds {
  minDays: number;
  maxDays: number;
}

export const DEFAULT_RETENTION_BOUNDS: RetentionBounds = { minDays: 1, maxDays: 3650 };

export function assertRetentionBounds({ minDays, maxDays }: RetentionBounds): void {
  if (!Number.isSafeInteger(minDays) || !Number.isSafeInteger(maxDays) || minDays < 1 || maxDays < minDays) {
    throw new Error('Retention bounds must be positive integer days with minimum <= maximum.');
  }
}

const applicationSchema = {
  type: 'string',
  minLength: 1,
  maxLength: APPLICATION_MAX_LENGTH,
  pattern: APPLICATION_PATTERN,
};
const retentionClassSchema = { type: 'string', minLength: 1, pattern: APPLICATION_PATTERN };
const classesSchema = {
  type: 'object',
  propertyNames: retentionClassSchema,
  additionalProperties: {
    type: 'object',
    properties: { days: { type: 'integer', minimum: 1 } },
    required: ['days'],
    additionalProperties: false,
  },
};

export const actionCatalogSchema = {
  type: 'object',
  properties: {
    kind: { const: 'actionCatalog' },
    application: applicationSchema,
    actions: {
      type: 'object',
      propertyNames: { type: 'string', pattern: '^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$' },
      additionalProperties: {
        type: 'object',
        properties: {
          version: { type: 'integer', minimum: 1 },
          category: { type: 'string', enum: ['administrative', 'runtime', 'security', 'data-access'] },
          severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
          retentionClass: retentionClassSchema,
          description: { type: 'string', minLength: 1, pattern: '\\S' },
          resourceType: { type: 'string', minLength: 1 },
          captureChangeSet: { type: 'boolean' },
          forwardToSiem: { type: 'boolean' },
          metadataSchema: { type: 'object', $ref: 'http://json-schema.org/draft-07/schema#' },
        },
        required: ['version', 'category', 'severity', 'retentionClass'],
        additionalProperties: false,
      },
    },
  },
  required: ['kind', 'application', 'actions'],
  additionalProperties: false,
};

const retentionSettingsSchema = {
  type: 'object',
  properties: { kind: { const: 'retentionSettings' }, classes: classesSchema },
  required: ['kind', 'classes'],
  additionalProperties: false,
};

const applicationRetentionSettingsSchema = {
  type: 'object',
  properties: {
    kind: { const: 'applicationRetentionSettings' },
    application: applicationSchema,
    classes: classesSchema,
  },
  required: ['kind', 'application', 'classes'],
  additionalProperties: false,
};

const structuralConfigurationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  oneOf: [actionCatalogSchema, retentionSettingsSchema, applicationRetentionSettingsSchema],
};

export function createConfigurationSchema(bounds: RetentionBounds = DEFAULT_RETENTION_BOUNDS) {
  assertRetentionBounds(bounds);
  const boundedClasses = {
    ...classesSchema,
    additionalProperties: {
      ...classesSchema.additionalProperties,
      properties: { days: { type: 'integer', minimum: bounds.minDays, maximum: bounds.maxDays } },
    },
  };
  return {
    ...structuralConfigurationSchema,
    oneOf: [
      actionCatalogSchema,
      { ...retentionSettingsSchema, properties: { ...retentionSettingsSchema.properties, classes: boundedClasses } },
      {
        ...applicationRetentionSettingsSchema,
        properties: { ...applicationRetentionSettingsSchema.properties, classes: boundedClasses },
      },
    ],
  };
}

export const configurationSchema = createConfigurationSchema();

export function createAuditConfigurationConverter(logger: Logger): (value: unknown) => AuditConfiguration | null {
  const validation = new AjvValidationService(logger);
  // The SDK converts thrown converter errors into missing configuration. Check deployment-specific
  // bounds in RetentionService instead, so an old out-of-range period cannot become a default.
  validation.setSchema('audit-configuration', structuralConfigurationSchema);

  function assertConfiguration(value: unknown): asserts value is AuditConfiguration {
    validation.validate('audit configuration', 'audit-configuration', value);
  }

  return (value) => {
    // Missing configuration is null for active reads and {} for latest reads.
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
      return null;
    }
    assertConfiguration(value);
    if (value.kind !== 'actionCatalog') {
      return value;
    }
    return {
      ...value,
      actions: Object.fromEntries(
        Object.entries(value.actions).map(([name, definition]) => [
          name,
          { captureChangeSet: false, forwardToSiem: false, ...definition },
        ]),
      ),
    };
  };
}

export function createCatalogConverter(logger: Logger): (value: unknown) => ActionCatalog | null {
  const convert = createAuditConfigurationConverter(logger);
  return (value) => {
    const configuration = convert(value);
    if (!configuration) return null;
    if (configuration.kind !== 'actionCatalog') {
      throw new Error('Expected an action catalog.');
    }
    return configuration;
  };
}

export function combineCatalogs(tenant: ActionCatalog | null, core: ActionCatalog | null): ActionCatalog | null {
  if (tenant && core && tenant.application !== core.application) {
    throw new Error('Core and tenant action catalogs have different applications.');
  }
  const catalog = core || tenant;
  return catalog ? { ...catalog, actions: { ...tenant?.actions, ...core?.actions } } : null;
}

export function combineAuditConfiguration(
  tenant: AuditConfiguration | null,
  core: AuditConfiguration | null,
): AuditConfiguration | null {
  const configuration = tenant || core;
  if (!configuration) return null;
  if (tenant && core && tenant.kind !== core.kind) {
    throw new Error('Core and tenant configuration documents have different kinds.');
  }
  if (configuration.kind === 'actionCatalog') {
    return combineCatalogs(
      tenant?.kind === 'actionCatalog' ? tenant : null,
      core?.kind === 'actionCatalog' ? core : null,
    );
  }
  if (tenant?.kind === 'applicationRetentionSettings' && core?.kind === 'applicationRetentionSettings') {
    if (tenant.application !== core.application) {
      throw new Error('Core and tenant retention settings have different applications.');
    }
  }
  return {
    ...configuration,
    classes: {
      ...(core && core.kind !== 'actionCatalog' ? core.classes : {}),
      ...(tenant && tenant.kind !== 'actionCatalog' ? tenant.classes : {}),
    },
  };
}
