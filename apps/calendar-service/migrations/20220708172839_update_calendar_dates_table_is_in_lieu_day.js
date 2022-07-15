const TABLE_NAME = 'calendar_dates';

exports.up = async function (knex) {
  const calendarDates = await knex.select().from(TABLE_NAME).orderBy('id', 'asc');
  const n = calendarDates.length;

  for (let i = 0; i < n; i++) {
    const today = calendarDates[i];
    if (i < n - 3) {
      const tomorrow = calendarDates[i + 1];
      // case 1: Sunday and Saturday are both holiday.

      if (
        today.day_of_week === 6 &&
        today.is_holiday === true &&
        tomorrow.day_of_week === 7 &&
        tomorrow.is_holiday === true
      ) {
        await knex(TABLE_NAME)
          .whereIn('id', [calendarDates[i + 2].id, calendarDates[i + 3].id])
          .update({ is_in_lieu_day: true });
      } else {
        // case 2: one of Sunday or Saturday is holiday.

        if (
          (today.day_of_week === 6 && today.is_holiday === true) ||
          (tomorrow.day_of_week === 7 && tomorrow.is_holiday === true)
        ) {
          await knex(TABLE_NAME)
            .where({ id: calendarDates[i + 2].id })
            .update({ is_in_lieu_day: true });
        }
      }
    } else {
      if (i < n - 2) {
        if (today.is_holiday === true && today.day_of_week === 7) {
          await knex(TABLE_NAME)
            .where({ id: calendarDates[i + 1].id })
            .update({ is_in_lieu_day: true });
        }
      }
    }
  }
};

exports.down = async function () {
  // No down for this migration.
};
