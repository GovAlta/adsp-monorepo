export interface ConfigurationDefinition {
  configurationSchema: Record<string, unknown>;
}
export interface ConfigurationDefinitionTypes {
  core: Record<string, unknown>;
  tenant: Record<string, unknown>;
}
export interface ConfigurationState {
  coreConfigDefinitions: Record<string, unknown>;
  tenantConfigDefinitions: Record<string, unknown>;
  isAddedFromOverviewPage: boolean;
}

export interface ConfigDefinition {
  name: string;
  namespace: string;
  payloadSchema: ConfigurationSchema;
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
  payloadSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};
