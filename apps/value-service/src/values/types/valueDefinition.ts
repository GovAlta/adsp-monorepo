export interface ValueDefinition {
  name: string;
  description: string;
  type: string;
  jsonSchema: Record<string, unknown>;
}
