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

export const configurationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  oneOf: [actionCatalogSchema, retentionSettingsSchema, applicationRetentionSettingsSchema],
};

export function createCatalogConverter(logger: Logger): (value: unknown) => ActionCatalog | null {
  const validation = new AjvValidationService(logger);
  validation.setSchema('audit-action-catalog', actionCatalogSchema);

  function assertCatalog(value: unknown): asserts value is ActionCatalog {
    validation.validate('audit action catalog', 'audit-action-catalog', value);
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
    assertCatalog(value);
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

export function combineCatalogs(tenant: ActionCatalog | null, core: ActionCatalog | null): ActionCatalog | null {
  if (tenant && core && tenant.application !== core.application) {
    throw new Error('Core and tenant action catalogs have different applications.');
  }
  const catalog = core || tenant;
  return catalog ? { ...catalog, actions: { ...tenant?.actions, ...core?.actions } } : null;
}
