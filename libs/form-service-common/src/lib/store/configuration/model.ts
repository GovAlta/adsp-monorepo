import { RegisterData } from '@abgov/jsonforms-components';

export const allNames = 'all names';

export interface ConfigurationDefinition {
  configurationSchema: Record<string, SchemaType>;
  description: string;
}
export interface ConfigurationDefinitionTypes {
  core: ServiceSchemas;
  tenant: ServiceSchemas;
}
export interface ConfigurationDefinitionState {
  coreConfigDefinitions: ServiceSchemas;
  tenantConfigDefinitions: ServiceSchemas;
  isAddedFromOverviewPage: boolean;
  importedConfigurationError: { name: string; error: string }[];
  imports: ServiceConfiguration[];
  configurationRevisions: {
    service?: string;
    revisions?: { result?: []; next?: string; active?: number; latest?: number; isCore?: boolean };
  };
  registers?: RegisterData;
  nonAnonymous?: string[];
  dataList?: string[];
  serviceList: string[];
  openEditor: string;
}

export interface ConfigDefinition {
  name: string;
  namespace: string;
  description?: string;
  anonymousRead?: boolean;
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
  anonymousRead: false,
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
  description?: string;
}

export interface ServiceConfiguration {
  namespace: string;
  name: string;
  description?: string;
  latest: ServiceSchemas;
  active: ServiceSchemas;
  success?: boolean;
  error?: string;
}

export interface ServiceConfigurationTypes {
  core: ServiceConfiguration;
  tenant: ServiceConfiguration;
}

export interface ConfigurationExportType {
  configuration: unknown;
  revision: number;
  description?: string;
}

export interface ReplaceConfiguration {
  namespace: string;
  name: string;
  configuration: Record<string, SchemaType>;
}
export type ConfigurationExportState = Record<Service, ConfigurationExportType>;

export interface Revision {
  revision: number;
  lastUpdated: string;
  created: string;
  configuration: Record<string, SchemaType>;
}
