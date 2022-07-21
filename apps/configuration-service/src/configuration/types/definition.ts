export interface ConfigurationDefinition {
  /**
   * @deprecated - use configuration.schema
   */
  configurationSchema: Record<string, unknown>;
  configuration?: {
    description?: string;
    schema?: Record<string, unknown>;
  };
}

export type ConfigurationDefinitions = Record<string, ConfigurationDefinition>;
