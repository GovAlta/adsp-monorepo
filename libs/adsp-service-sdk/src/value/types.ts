export interface ValueDefinition {
  id: string;
  name: string;
  description: string;
  jsonSchema: Record<string, unknown>;
}
