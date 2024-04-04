import * as Ajv from 'ajv';
import { Logger } from 'winston';
import { InvalidValueError } from '..';
import { ValidationService } from './service';
import * as schemaMigration from 'json-schema-migrate';

export class AjvValidationService implements ValidationService {
  protected ajv: Ajv.Ajv = new Ajv();

  constructor(private logger: Logger) {
    this.ajv.addFormat('file-urn', /^urn:[a-zA-Z0-9.-]+(:[a-zA-Z0-9.-]+)*$/);
  }

  setSchema(schemaKey: string, schema: Record<string, unknown>): void {
    if (schema?.$async) {
      throw new Error(`Schema for key '${schemaKey}' uses an async schema which is not supported.`);
    }

    try {
      if (schema?.$schema === 'http://json-schema.org/draft-04/schema#') {
        schemaMigration.draft7(schema);
      }

      this.ajv.removeSchema(schemaKey).addSchema(schema || {}, schemaKey);
    } catch (err) {
      this.logger.error(`Schema for key '${schemaKey}' is invalid.`);
      throw err;
    }
  }

  validate(context: string, schemaKey: string, value: unknown): void {
    const result = this.ajv.validate(schemaKey, value);
    if (!result) {
      const errors = this.ajv.errorsText(this.ajv.errors);
      throw new InvalidValueError(context, errors);
    }
  }
}
