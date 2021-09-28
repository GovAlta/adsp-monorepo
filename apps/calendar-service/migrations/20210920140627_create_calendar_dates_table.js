/* eslint-disable no-undef */

// 365.25 * Years = Total days
const YearsToSeed = 30;

exports.up = function (knex) {
  const schema = knex.schema.createTable('calendar_dates', function (table) {
    table.integer('id').notNullable().primary();
    table.date('date_value').notNullable();
    table.integer('day_of_week').notNullable();
    table.integer('day_of_month').notNullable();
    table.integer('day_of_year').notNullable();
    table.integer('week_of_month').notNullable();
    table.integer('week_of_year').notNullable();
    table.integer('month_of_year').notNullable();
    table.integer('year').notNullable();
    table.boolean('is_business_day').notNullable();
    table.boolean('is_weekend').notNullable();
    table.boolean('is_holiday').notNullable();
    table.boolean('is_stat_holiday').notNullable();
    table.string('holiday', 50);
  });

  // Insert 20 years of dates.
  schema.raw(`
    INSERT INTO calendar_dates
    SELECT TO_CHAR(datum, 'yyyymmdd')::INT AS id,
          datum AS date_value,
          EXTRACT(ISODOW FROM datum) AS day_of_week,
          EXTRACT(DAY FROM datum) AS day_of_month,
          EXTRACT(DOY FROM datum) AS day_of_year,
          TO_CHAR(datum, 'W')::INT AS week_of_month,
          EXTRACT(WEEK FROM datum) AS week_of_year,
          EXTRACT(MONTH FROM datum) AS month_of_year,
          EXTRACT(YEAR FROM datum) AS year,
          FALSE AS is_business_day,
          CASE
              WHEN EXTRACT(ISODOW FROM datum) IN (6, 7) THEN TRUE
              ELSE FALSE
              END AS is_weekend,
          FALSE as is_holiday,
          FALSE as is_stat_holiday,
          null as holiday
    FROM (SELECT '2020-01-01'::DATE + SEQUENCE.DAY AS datum
          FROM GENERATE_SERIES(0, ${Math.ceil(YearsToSeed * 365.25)}) AS SEQUENCE (DAY)
          GROUP BY SEQUENCE.DAY) DQ
    ORDER BY 1;
  `);

  return schema;
};

exports.down = function (knex) {
  return knex.schema.dropTable('calendar_dates');
};
