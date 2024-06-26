export interface ConfigurationDefinition {
  configurationSchema: Record<string, unknown>;
  anonymousRead?: boolean;
}

export type ConfigurationDefinitions = Record<string, ConfigurationDefinition>;
