import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import * as schemaMigration from 'json-schema-migrate';
import { Logger } from 'winston';
import { InvalidValueError } from '../errors';
import { ValidationService } from './service';
export class AjvValidationService implements ValidationService {
  protected ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log', strictRequired: false, useDefaults: true });
  protected ajvErrors: string[] = [];

  constructor(private logger: Logger) {
    addFormats(this.ajv);
    addErrors(this.ajv);

    this.ajv.addFormat('file-urn', {
      type: 'string',
      validate: (input) => {
        const fileUrnRegExp = new RegExp('^urn:ads:platform:file-service:v[0-9]:/files/[a-zA-Z0-9.-]*$');
        const fileUrns = input.split(';');
        for (const urn of fileUrns) {
          if (!fileUrnRegExp.test(urn)) {
            return false;
          }
        }
        return true;
      },
    });
    this.ajv.addFormat('time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
    this.ajv.addFormat('computed', /^[a-zA-Z0-9._-]+$/);
    this.ajv.addSchema(standardV1JsonSchema);
    this.ajv.addSchema(commonV1JsonSchema);
  }

  setSchema(schemaKey: string, schema: Record<string, unknown>): void {
    if (schema?.$async) {
      throw new Error(`Schema for key '${schemaKey}' uses an async schema which is not supported.`);
    }

    try {
      if (schema?.$schema === 'http://json-schema.org/draft-04/schema#') {
        schemaMigration.draft7(schema);
      }

      this.ajv.removeSchema(schemaKey).addSchema(this.removeEmptyEnum(schema) || {}, schemaKey);
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

  removeEmptyEnum(schema: Record<string, unknown>): Record<string, unknown> {
    const newSchema = JSON.parse(JSON.stringify(schema));

    Object.keys(newSchema?.properties || {}).forEach((propertyName) => {
      const property = newSchema.properties || {};
      if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '')
        delete property[propertyName].enum;
    });

    return newSchema;
  }
}
