const TABLE_NAME = 'calendar_dates';

exports.up = function (knex) {
  return knex.schema.table(TABLE_NAME, (table) => {
    table.boolean('is_in_lieu_day').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn('is_in_lieu_day');
  });
};
