const TABLE_NAME = 'calendar_dates';
const TRUTH_AND_RECONCILIATION_DAY = 'National Day for Truth and Reconciliation';

// Official names, as listed on https://www.alberta.ca/alberta-general-holidays
const RENAMES = [
  ['Family Day', 'Alberta Family Day'],
  ['Thanksgiving', 'Thanksgiving Day'],
];

// Easter Monday 2033 was seeded on Friday, April 22 instead of Monday, April 18.
const EASTER_MONDAY_2033 = { seeded: 20330422, actual: 20330418 };

async function moveEasterMonday2033(knex, from, to) {
  const moved = await knex(TABLE_NAME)
    .where({ id: from, holiday: 'Easter Monday', is_weekend: false, is_in_lieu_day: false })
    .update({ holiday: null, holiday_type: null, is_holiday: false, is_business_day: true });

  if (moved) {
    await knex(TABLE_NAME)
      .where({ id: to, holiday: null, is_weekend: false, is_in_lieu_day: false })
      .update({ holiday: 'Easter Monday', holiday_type: 'optional', is_holiday: true, is_business_day: false });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.string('holiday_type', 20);
  });

  for (const [from, to] of RENAMES) {
    await knex(TABLE_NAME).where({ holiday: from }).update({ holiday: to });
  }

  await moveEasterMonday2033(knex, EASTER_MONDAY_2033.seeded, EASTER_MONDAY_2033.actual);

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
  await moveEasterMonday2033(knex, EASTER_MONDAY_2033.actual, EASTER_MONDAY_2033.seeded);

  for (const [from, to] of RENAMES) {
    await knex(TABLE_NAME).where({ holiday: to }).update({ holiday: from });
  }

  await knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn('holiday_type');
  });
};
