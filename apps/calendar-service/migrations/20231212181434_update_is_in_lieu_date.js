// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */

const TABLE_NAME = 'calendar_dates';
// This migration is used to fix the previous is_in_lieu_day calculation error in  20220708172839_update_calendar_dates_table_is_in_lieu_day.js
exports.up = async function (knex) {
  // For convenience, we roll back previous update.
  await knex(TABLE_NAME).update({ is_in_lieu_day: false });
  const calendarDates = await knex.select().from(TABLE_NAME).orderBy('date_value', 'asc');
  const n = calendarDates.length;

  for (let i = 0; i < n; i++) {
    const today = calendarDates[i];
    const holiday_in_weekend = today.is_holiday === true && today.is_weekend === true;
    const holiday_of_prev_in_lieu_day = today.is_holiday === true && today.is_in_lieu_day === true;
    if (holiday_in_weekend || holiday_of_prev_in_lieu_day) {
      let inLieuIndex = i + 1;
      while (inLieuIndex < n) {
        const inLieuDate = calendarDates[inLieuIndex];
        if (inLieuDate.is_in_lieu_day === true || inLieuDate.is_weekend === true) {
          inLieuIndex = inLieuIndex + 1;
        } else {
          calendarDates[inLieuIndex].is_in_lieu_day = true;
          break;
        }
      }
    }
  }
  const inLieuIndexes = calendarDates.filter((c) => c.is_in_lieu_day === true).map((c) => c.id);
  await knex(TABLE_NAME).whereIn('id', inLieuIndexes).update({ is_in_lieu_day: true });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
