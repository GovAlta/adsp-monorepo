export interface EventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
}
