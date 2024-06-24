export interface ConfigurationDefinition {
  anonymousRead: boolean;
  configurationSchema: Record<string, unknown>;
}

export type ConfigurationDefinitions = Record<string, ConfigurationDefinition>;
