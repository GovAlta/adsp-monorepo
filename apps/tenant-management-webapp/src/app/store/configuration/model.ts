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
  isLoading: {
    definitions: boolean;
    log: boolean;
  };
}
export const defaultConfigDefinition = {
  isCore: false,
  namespace: '',
  name: '',
  payloadSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};
