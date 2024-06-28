export interface ConfigurationDefinition {
  configurationSchema: Record<string, unknown>;
  anonymousRead?: boolean;
  isForNamespace?: boolean;
}

export type ConfigurationDefinitions = Record<string, ConfigurationDefinition>;
