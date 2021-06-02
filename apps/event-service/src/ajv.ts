import * as Ajv from 'ajv';
import { Logger } from 'winston';
import { EventDefinition, ValidationService } from './event';

export class AjvValidationService implements ValidationService {
  private ajv: Ajv.Ajv = new Ajv();

  constructor(private logger: Logger) {}

  validate(namespace: string, definition: EventDefinition, value: unknown): boolean {
    if (definition.payloadSchema?.$async) {
      this.logger.error(`Event ${namespace}-${definition.name} uses an async schema which is not supported.`);
      return false;
    } else {
      return this.ajv.validate(definition.payloadSchema || {}, value) as boolean;
    }
  }
}
