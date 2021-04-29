import { IsNotEmpty } from 'class-validator';
import { InvalidOperationError, UnauthorizedError, Update, User } from '@core-services/core-common';
import { ValuesRepository } from '../repository';
import { MetricCriteria, Value, ValueCriteria, ValueDefinition } from '../types';
import { ValidationService } from '../validation';

export class ValueDefinitionEntity implements ValueDefinition {

  @IsNotEmpty()
  public namespace: string;
  @IsNotEmpty()
  public name: string;
  public description: string;
  public type: string;
  public jsonSchema: Record<string, unknown>;
  @IsNotEmpty()
  public readRoles: string[];
  @IsNotEmpty()
  public writeRoles: string[];

  constructor(
    private repository: ValuesRepository,
    public validationService: ValidationService,
    namespace: string,
    definition: ValueDefinition,
    public isNew = false
  ) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.type = definition.type;
    this.jsonSchema = definition.jsonSchema;
    this.readRoles = definition.readRoles || [];
    this.writeRoles = definition.writeRoles || [];
    this.validationService.setSchema(this);
  }

  public update(update: Update<ValueDefinition>) {
    if (update.description) {
      this.description = update.description;
    }

    if (update.type) {
      this.type = update.type;
    }

    if (update.jsonSchema) {
      this.jsonSchema = update.jsonSchema;
      this.validationService.setSchema(this);
    }

    if (update.readRoles) {
      this.readRoles = update.readRoles;
    }

    if (update.writeRoles) {
      this.writeRoles = update.writeRoles;
    }
  }

  public canWriteValue(user: User) {
    return user &&
      user.roles &&
      this.writeRoles.find(r => user.roles.includes(r));
  }

  public canReadValue(user: User) {
    return this.readRoles.length < 1 || (
      user &&
      user.roles &&
      this.readRoles.find(r => user.roles.includes(r))
    );
  }

  public writeValue(user: User, value: Value) {
    if (!this.canWriteValue(user)) {
      throw new UnauthorizedError('User not authorized to write value.');
    }

    if((value as Value).value === undefined) {
      value = {
        context: {},
        correlationId: null,
        timestamp: new Date(),
        value
      }
    }

    if (!this.validationService.validate(this, value.value)) {
      throw new InvalidOperationError('Value does not match schema.');
    }

    const valueRecord = {
      context: value.context,
      timestamp: value.timestamp || new Date(),
      correlationId: value.correlationId,
      value: value.value
    }

    if (value.value && value.value['val-metrics']) {
      const metrics: {[name: string]: number} = value.value['val-metrics'];
      delete value.value['val-metrics'];

      Object.entries(metrics).forEach(([name, value]) =>
        this.repository.writeMetric(this, name, valueRecord.timestamp, value)
      );
    }

    return this.repository.writeValue(this, valueRecord);
  }

  public readValues(user: User, criteria: ValueCriteria) {
    if (!this.canReadValue(user)) {
      throw new UnauthorizedError('User not authorized to read value.');
    }

    return this.repository.readValues(this, criteria);
  }

  public readValueMetric(
    user: User,
    metric: string,
    criteria?: MetricCriteria
  ) {
    if (!this.canReadValue(user)) {
      throw new UnauthorizedError('User not authorized to read value.');
    }

    return this.repository.readMetric(this, metric, criteria);
  }
}
