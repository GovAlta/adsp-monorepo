const TABLE_NAME = 'calendar_dates';
const TRUTH_AND_RECONCILIATION_DAY = 'National Day for Truth and Reconciliation';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.string('holiday_type', 20);
  });

  await knex(TABLE_NAME).where({ is_stat_holiday: true }).update({ holiday_type: 'general' });
  await knex(TABLE_NAME)
    .whereIn('holiday', ['Easter Monday', 'Heritage Day', 'Boxing Day'])
    .update({ holiday_type: 'optional' });
  await knex(TABLE_NAME)
    .whereIn('holiday', ['Christmas Closure', 'Christmas Floater'])
    .update({ holiday_type: 'staff' });

  // September 30, first observed in 2021. It is an optional holiday that GoA offices don't close for, so is_holiday
  // and is_business_day are unchanged and there is no in-lieu day when it falls on a weekend.
  await knex(TABLE_NAME)
    .where({ month_of_year: 9, day_of_month: 30 })
    .andWhere('year', '>=', 2021)
    .whereNull('holiday')
    .update({ holiday: TRUTH_AND_RECONCILIATION_DAY, holiday_type: 'optional' });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(TABLE_NAME).where({ holiday: TRUTH_AND_RECONCILIATION_DAY }).update({ holiday: null });
  await knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn('holiday_type');
  });
};
