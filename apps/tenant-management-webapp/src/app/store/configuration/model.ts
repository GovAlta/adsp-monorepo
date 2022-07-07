export interface ConfigurationDefinition {
  configurationSchema: Record<string, SchemaType>;
}
export interface ConfigurationDefinitionTypes {
  core: ServiceSchemas;
  tenant: ServiceSchemas;
}
export interface ConfigurationDefinitionState {
  coreConfigDefinitions: ServiceSchemas;
  tenantConfigDefinitions: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
  importedConfigurationError: string[];
}

export interface ConfigDefinition {
  name: string;
  namespace: string;
  description?: string;
  configurationSchema: ConfigurationSchema;
  serviceSchemas?: ServiceSchemas;
}

export interface ConfigurationSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}
export const defaultConfigDefinition: ConfigDefinition = {
  namespace: '',
  name: '',
  description: '',
  configurationSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};

// Type is unknown because its up to another application to define.
// However, its useful to know that such-and-such an object is the
// actual configuration schema we are looking for.
export type SchemaType = unknown;
export type Service = string; // a service is identified by "<namespace>:<name>"

export interface ServiceSchemas {
  configuration: Record<Service, SchemaType>;
  revision: number;
}

export interface ServiceConfiguration {
  namespace: string;
  name: string;
  description?: string;
  latest: ServiceSchemas;
}

export interface ServiceConfigurationTypes {
  core: ServiceConfiguration;
  tenant: ServiceConfiguration;
}

export interface ConfigurationExportType {
  configuration: unknown;
  revision: number;
}

export interface ConfigurationRevisionRequest {
  name: string;
  namespace: string;
}
export interface ReplaceConfiguration {
  namespace: string;
  name: string;
  configuration: Record<Service, SchemaType>;
}
export type ConfigurationExportState = Record<Service, ConfigurationExportType>;
