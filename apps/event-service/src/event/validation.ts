import * as Ajv from 'ajv';
import { InvalidOperationError } from '@core-services/core-common';
import { EventDefinition } from './types';

export interface ValidationService {
  validate(valueDefinition: EventDefinition, value: unknown): boolean
  setSchema(definition: EventDefinition): void
}

export class AjvValidationService implements ValidationService {
  private ajv: Ajv.Ajv;

  constructor(private namespace: string) {
    this.ajv = new Ajv();
  }

  setSchema(definition: EventDefinition) {
    const schemaKey = this.getSchemaKey(definition);
    try {
      this.ajv.removeSchema(schemaKey)
      .addSchema(
        definition.payloadSchema || {}, 
        schemaKey
      );
    }
    catch (err) {
      throw new InvalidOperationError('Schema is invalid.');
    }
  }
  
  validate(definition: EventDefinition, value: unknown) {
    return this.ajv.validate(
      this.getSchemaKey(definition), 
      value
    ) as boolean;
  }

  private getSchemaKey(definition: EventDefinition) {
    return `value:${this.namespace}:${definition.name}`
  }
}
