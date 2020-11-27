import * as Knex from 'knex';
import { decodeAfter, encodeNext, InvalidOperationError, Results, User } from '@core-services/core-common';
import { Value, ValueDefinition, ValueCriteria, ValueDefinitionEntity, ValuesRepository, Namespace, NamespaceEntity, MetricValue, Metric, MetricCriteria } from '../values';

type ValueRecord = Value & { namespace: string, name: string}

export class TimescaleValuesRepository implements ValuesRepository {
  
  constructor(private knex: Knex) {
  }

  getNamespaces(top: number, after: string): Promise<Results<NamespaceEntity>> {
    const skip = decodeAfter(after);
    return this.knex<Namespace>('namespaces')
    .limit(top)
    .offset(skip)
    .then(rows => ({
      results: rows.map(row => new NamespaceEntity(this, row)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length
      }
    }));
  }
  
  getNamespace(name: string): Promise<NamespaceEntity> {
    return Promise.all([
      this.knex<Namespace>('namespaces')
      .where('name', name)
      .first(),
      this.knex<ValueDefinition>('valueDefinitions')
      .where('namespace', name)
    ]).then(([namespace, definitions]) => {
      return (namespace) ?
        new NamespaceEntity(this, {
          ...namespace, 
          definitions: definitions.reduce(
            (defs, def) => ({...defs, [def.name]: def}), {}
          )
        }) : 
        null
    });
  }

  save(entity: NamespaceEntity): Promise<NamespaceEntity> {
    return (
      entity.isNew ?
        this.knex<Namespace>('namespaces')
        .insert({
          name: entity.name,
          description: entity.description,
          adminRole: entity.adminRole
        })
        .returning('*') :
        this.knex<Namespace>('namespaces')
        .update({
          name: entity.name,
          description: entity.description,
          adminRole: entity.adminRole
        })
        .where('name', entity.name)
        .returning('*')
    ).then((rows) => {
      const row = rows[0];
      return row ? 
        new NamespaceEntity(this, row) : 
        null;
    });
  }

  saveDefinition(entity: ValueDefinitionEntity) {
    return (
      entity.isNew ?
        this.knex<ValueDefinition & { namespace: string }>('valueDefinitions')
        .insert({
          namespace: entity.namespace,
          name: entity.name,
          description: entity.description,
          type: entity.type,
          jsonSchema: entity.jsonSchema,
          readRoles: entity.readRoles,
          writeRoles: entity.writeRoles
        })
        .returning('*') :
        this.knex<ValueDefinition & { namespace: string }>('valueDefinitions')
        .update({
          description: entity.description,
          type: entity.type,
          jsonSchema: entity.jsonSchema,
          readRoles: entity.readRoles,
          writeRoles: entity.writeRoles
        })
        .where({
          namespace: entity.namespace,
          name: entity.name
        })
        .returning('*')
    ).then((rows) => {
      const row = rows[0];
      return row ? 
        new ValueDefinitionEntity(
          this, 
          entity.validationService, 
          entity.namespace, 
          row
        ) : 
        null;
    })
  }
  
  writeValue(definition: ValueDefinitionEntity, value: Value): Promise<Value> {
    return this.knex<ValueRecord>('values')
    .insert({
      namespace: definition.namespace,
      name: definition.name,
      timestamp: value.timestamp,
      correlationId: value.correlationId,
      context: value.context || {},
      value: value.value
    })
    .returning('*')
    .then(([row])=> ({
      timestamp: row.timestamp,
      correlationId: row.correlationId,
      context: row.context,
      value: row.value
    }));
  }
  
  readValues(definition: ValueDefinitionEntity, criteria: ValueCriteria): Promise<Value[]> {
    let query = this.knex<ValueRecord>('values')
    .where({
      namespace: definition.namespace,
      name: definition.name
    });

    if (criteria.top) {
      query = query.limit(criteria.top)
    }

    if (criteria.timestampMax) {
      query = query.where('timestamp', '<=', criteria.timestampMax)
    }

    if (criteria.timestampMin) {
      query = query.where('timestamp', '>=', criteria.timestampMin)
    }
    
    return query.orderBy('timestamp', 'desc')
    .then(rows => 
      rows.map(row => ({
        timestamp: row.timestamp,
        correlationId: row.correlationId,
        context: row.context,
        value: row.value
      }))
    );
  }

  readMetric(
    definition: ValueDefinitionEntity, 
    metric: string, 
    criteria: MetricCriteria
  ): Promise<Metric> {

    let view = null;
    switch (criteria.interval) {
      case 'hourly':
      case 'daily':
      case 'weekly':
        view = `metrics_${criteria.interval}`
        break;
      default:
        throw new InvalidOperationError('Interval value is not recognized.');
    }

    let query = this.knex(view)
    .select('bucket', 'sum', 'avg', 'min', 'max')
    .where({
      namespace: definition.namespace,
      name: definition.name,
      metric
    });

    if (criteria.intervalMax) {
      query = query.where('bucket', '<=', criteria.intervalMax);
    }

    if (criteria.intervalMin) {
      query = query.where('bucket', '>=', criteria.intervalMin);
    }

    return query
    .then(rows => ({
      name: metric,
      values: rows.map(row => ({
        interval: new Date(row.bucket),
        sum: row.sum,
        avg: row.avg,
        min: row.min,
        max: row.max
      }))
    }));
  }

  writeMetric(
    definition: ValueDefinitionEntity, 
    metric: string, 
    timestamp: Date, 
    value: number
  ): Promise<MetricValue> {
    return this.knex<MetricValue>('metrics')
    .insert({
      namespace: definition.namespace,
      name: definition.name,
      metric,
      timestamp,
      value: value
    })
    .returning('*')
    .then(([row]) => ({
      namespace: row.namespace,
      name: row.name,
      metric: row.metric,
      timestamp: row.timestamp,
      value: row.value
    }));
  }
}
