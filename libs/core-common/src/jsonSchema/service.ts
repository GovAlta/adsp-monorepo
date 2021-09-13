export interface ValidationService {
  setSchema(schemaKey: string, schema: Record<string, unknown>): void;
  validate(context: string, schemaKey: string, value: unknown): void;
}
