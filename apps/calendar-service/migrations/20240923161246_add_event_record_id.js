const TABLE_NAME = 'calendar_events';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table(TABLE_NAME, (table) => {
      table.string('record_id').index(['tenant', 'calendar', 'record_id']);
    })
    .raw('CREATE INDEX idx_context on ?? USING GIN (?? jsonb_path_ops)', [TABLE_NAME, 'context']);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table(TABLE_NAME, (table) => {
    table.dropIndex('idx_context').dropIndex(['tenant', 'calendar', 'record_id']).dropColumn('record_id');
  });
};
