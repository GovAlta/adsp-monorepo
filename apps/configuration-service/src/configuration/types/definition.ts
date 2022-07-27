export interface ConfigurationDefinition {
  configurationSchema: Record<string, unknown>;
}

export type ConfigurationDefinitions = Record<string, ConfigurationDefinition>;
