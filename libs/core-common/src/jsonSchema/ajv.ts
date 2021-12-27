import * as Ajv from 'ajv';
import { Logger } from 'winston';
import { InvalidValueError } from '..';
import { ValidationService } from './service';

export class AjvValidationService implements ValidationService {
  protected ajv: Ajv.Ajv;

  constructor(private logger: Logger) {
    this.ajv = new Ajv();
    // eslint-disable-next-line
    require("ajv-keywords")(this.ajv, ["uniqueItemProperties"]);
  }

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

  validate(context: string, schemaKey: string, value: unknown): void {
    const result = this.ajv.validate(schemaKey, value);
    if (!result) {
      const errors = this.ajv.errorsText(this.ajv.errors);
      throw new InvalidValueError(context, errors);
    }
  }
}
