/* eslint-disable no-undef */

exports.up = function (knex) {
  // Christmas floating day - this is distinct from Christmas closure
  return knex.schema.raw(`
    DO $$
    DECLARE
      christmas record;
      floater integer;
    BEGIN
      FOR christmas IN SELECT year, day_of_week FROM calendar_dates WHERE holiday = 'Christmas Day'
      LOOP
        -- When Christmas falls on
        CASE christmas.day_of_week
        -- Monday
        WHEN 1 THEN floater := 27;
        -- Tuesday
        WHEN 2 THEN floater := 24;
        -- Wednesday
        WHEN 3 THEN floater := 27;
        -- Thursday
        WHEN 4 THEN floater := 24;
        -- Friday
        WHEN 5 THEN floater := 24;
        -- Saturday
        WHEN 6 THEN floater := 24;
        -- Sunday
        WHEN 7 THEN floater := 28;
        ELSE
        END CASE;

        UPDATE calendar_dates
        SET is_holiday = true, is_business_day = false, holiday = 'Christmas Floater'
        WHERE year = christmas.year
          AND month_of_year = 12
          AND day_of_month = floater;
      END LOOP;
    END; $$
  `);
};

exports.down = function (knex) {
  // No down for this migration.
};
