import { AjvValidationService } from '@core-services/core-common';
import { ValidateFunction } from 'ajv';
import { Logger } from 'winston';
import { ValueDefinitionEntity } from './values';

export class AjvValueValidationService extends AjvValidationService {
  constructor(logger: Logger) {
    super(logger);
    this.ajv.addKeyword(ValueDefinitionEntity.METRIC_META_KEY, {
      valid: true,
      modifying: true,
      type: ['integer', 'number'],
      compile:
        (schema): ValidateFunction =>
        (data, _dataPath, _parentData, _parentDataProperty, rootData) => {
          const name = Array.isArray(schema)
            ? schema.map((element) => rootData[element] || element).join(':')
            : `${schema}`;

          if (name && typeof data === 'number') {
            rootData[ValueDefinitionEntity.METRICS_KEY] = {
              ...rootData[ValueDefinitionEntity.METRICS_KEY],
              [name]: data,
            };
          }
          return true;
        },
    });
  }
}
