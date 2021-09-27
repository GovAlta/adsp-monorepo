/* eslint-disable no-undef */

exports.up = function(knex) {
  const schema = knex.schema.createTable('calendar_times', function (table) {
    table.integer('id').notNullable().primary();
    table.time('time_value').notNullable();
    table.boolean('is_business_hour').notNullable();
  });

  schema.raw(`
    INSERT INTO calendar_times
    SELECT TO_CHAR(datum, 'HH24MI')::INT AS id,
          datum as time_value,
          (datum >= '08:15:00' AND datum <= '16:30:00') as is_business_hour
    FROM (SELECT '00:00:00'::time + (SEQUENCE.MINUTE * INTERVAL '1 minute') AS datum
          FROM GENERATE_SERIES(1, 1440) AS SEQUENCE (MINUTE)
          GROUP BY SEQUENCE.MINUTE) DQ
    ORDER BY 1;
  `);

  return schema;
};

exports.down = function(knex) {
  return knex.schema.dropTable('calendar_times');
};
