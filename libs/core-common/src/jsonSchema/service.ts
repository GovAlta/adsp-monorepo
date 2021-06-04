export interface ValidationService {
  setSchema(schemaKey: string, schema: Record<string, unknown>): void;
  validate(schemaKey: string, value: unknown): boolean;
}
