/* eslint-disable no-undef */

exports.up = function(knex) {
  return knex.schema
  .createTable(
    'namespaces', 
    function(table) {
      table.string('name')
        .notNullable();
      table.string('displayName', 255);
      table.string('description', 1020);
      table.string('adminRole', 50)
        .notNullable();
      
      table.primary('name', 'pk_namespaces');
    }
  ).createTable(
    'valueDefinitions',
    function(table) {
      table.string('namespace')
        .notNullable();
      table.string('name')
        .notNullable();
      table.string('displayName', 255);
      table.string('description', 1020);
      table.string('type');
      table.jsonb('jsonSchema');
      table.specificType('readRoles', 'text[]');
      table.specificType('writeRoles', 'text[]');

      table.index('namespace', 'idx_namespace', 'hash');
      table.unique(['namespace', 'name'], 'pk_valueDefinitions');
      table.foreign('namespace')
        .references('name')
        .on('namespaces');
    }
  ).createTable(
    'values',
    function(table) {
      table.string('namespace')
        .notNullable();
      table.string('name')
        .notNullable();
      table.timestamp('timestamp')
        .notNullable();
      table.string('correlationId');
      table.jsonb('context');
      table.jsonb('value');

      table.index(['namespace', 'name'], 'idx_namespace_name');
      table.foreign('namespace')
        .references('name')
        .on('namespaces');
      table.foreign(['namespace', 'name'])
        .references(['namespace', 'name'])
        .on('valueDefinitions');
    }
  )
  .raw("SELECT create_hypertable('values', 'timestamp')");
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('values')
    .dropTable('valueDefinitions')
    .dropTable('namespaces');
};
