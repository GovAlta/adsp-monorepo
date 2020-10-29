import * as Ajv from 'ajv';
import { InvalidOperationError } from '@core-services/core-common';
import { ValueDefinition } from './types';

export interface ValidationService {
  validate(valueDefinition: ValueDefinition, value: unknown): boolean
  setSchema(definition: ValueDefinition): void
}

export class AjvValidationService implements ValidationService {
  private ajv: Ajv.Ajv;

  constructor(private namespace: string) {
    this.ajv = new Ajv();
    this.ajv.addKeyword(
      'val-metric', 
      {
        valid: true,
        modifying: true,
        type: ['integer', 'number'],
        compile: (schema) => 
        (data, _dataPath, _parentData, _parentDataProperty, rootData) => {
          const name = `${schema}`
          if (name && typeof data === 'number') {
            rootData['val-metrics'] = {
              ...(rootData['val-metrics'] || {}),
              [name]: data
            }
          }
          return true;
        }
      }
    );
  }

  setSchema(definition: ValueDefinition) {
    const schemaKey = this.getSchemaKey(definition);
    try {
      this.ajv.removeSchema(schemaKey)
      .addSchema(
        definition.jsonSchema || {}, 
        schemaKey
      );
    }
    catch (err) {
      throw new InvalidOperationError('Schema is invalid.');
    }
  }
  
  validate(definition: ValueDefinition, value: unknown) {
    return this.ajv.validate(
      this.getSchemaKey(definition), 
      value
    ) as boolean;
  }

  private getSchemaKey(definition: ValueDefinition) {
    return `value:${this.namespace}:${definition.name}`
  }
}
