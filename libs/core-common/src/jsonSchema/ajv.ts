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

    console.log(JSON.stringify(schemaKey) + '<schemaKey');
    console.log(JSON.stringify(schema) + '<schema');

    try {
      if (schema?.$schema === 'http://json-schema.org/draft-04/schema#') {
        schemaMigration.draft7(schema);
      }
      console.log(JSON.stringify(schema) + '<schmma------fffff1');

      const newSchema = JSON.parse(JSON.stringify(schema));
      console.log(JSON.stringify(schema) + '<schmma------fffff2');

      Object.keys(newSchema?.properties || {}).forEach((propertyName) => {
        console.log(JSON.stringify(propertyName) + '<propertyName------fffff');

        const property = newSchema.properties || {};
        if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '')
          delete property[propertyName].enum;
      });
      console.log(JSON.stringify(newSchema) + '<schmma------fffff3');

      this.ajv.removeSchema(schemaKey).addSchema(newSchema || {}, schemaKey);
    } catch (err) {
      this.logger.error(`Schema for key '${schemaKey}' is invalid.`);
      throw err;
    }
  }

  validate(context: string, schemaKey: string, value: unknown): void {
    console.log(JSON.stringify(context) + '<context');
    console.log(JSON.stringify(value) + '<value');
    const result = this.ajv.validate(schemaKey, value);
    if (!result) {
      const errors = this.ajv.errorsText(this.ajv.errors);
      throw new InvalidValueError(context, errors);
    }
  }
}
