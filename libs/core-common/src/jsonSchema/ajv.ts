import * as Ajv from 'ajv';
import { Logger } from 'winston';
import { ValidationService } from './service';

export class AjvValidationService implements ValidationService {
  protected ajv: Ajv.Ajv = new Ajv();

  constructor(private logger: Logger) {}

  setSchema(schemaKey: string, schema: Record<string, unknown>): void {
    if (schema?.$async) {
      throw new Error(`Schema for key '${schemaKey}' uses an async schema which is not supported.`);
    }

    try {
      this.ajv.removeSchema(schemaKey).addSchema(schema || {}, schemaKey);
    } catch (err) {
      this.logger.error(`Schema for key '${schemaKey}' is invalid.`);
      throw err;
    }
  }

  validate(schemaKey: string, value: unknown): boolean {
    return this.ajv.validate(schemaKey, value) as boolean;
  }
}
