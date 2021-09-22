/* eslint-disable no-undef */

exports.up = function (knex) {
  const schema = knex.schema;

  // Stat holidays

  // New Year's Day - first day of the year.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'New Year''s Day'
    WHERE day_of_year = 1;
  `);

  // Family Day - third Monday of February.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Family Day'
    FROM (
      SELECT id, date_value, row_number() over(partition by year order by day_of_month asc) as num
      FROM calendar_dates
      WHERE month_of_year = 2 and day_of_week = 1
    ) mondays
    WHERE calendar_dates.id = mondays.id AND mondays.num = 3;
  `);

  // Good Friday - Friday before Easter (moon cycles, etc...)
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Good Friday'
    WHERE id IN (
      20200410, 20210402, 20220415, 20230407, 20240329, 20250418, 20260403, 20270326, 20280414, 20290330,
      20300419, 20310411, 20320326, 20330415, 20340407, 20350323, 20360411, 20370403, 20380423, 20390408,
      20400330, 20410419, 20420404, 20430327, 20440415, 20450407, 20460323, 20470412, 20480403, 20490416
    );
  `);

  // Victoria Day - Monday before May 25.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Victoria Day'
    FROM (
      SELECT id, row_number() over(partition by year order by day_of_month desc) as num
      FROM calendar_dates
      WHERE month_of_year = 5
        AND day_of_week = 1
        AND day_of_month < 25
    ) mondays
    WHERE calendar_dates.id = mondays.id AND mondays.num = 1;
  `);

  // Canada Day - July 1st unless Sunday, then July 2nd (Monday).
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Canada Day'
    WHERE (month_of_year = 7 AND day_of_month = 1 AND day_of_week != 7)
      OR (month_of_year = 7 AND day_of_month = 2 AND day_of_week = 1);
  `);

  // Labour Day - first Monday in September.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Labour Day'
    FROM (
      SELECT id, date_value, row_number() over(partition by year order by day_of_month asc) as num
      FROM calendar_dates
      WHERE month_of_year = 9 and day_of_week = 1
    ) mondays
    WHERE calendar_dates.id = mondays.id AND mondays.num = 1;
  `);

  // Thanksgiving - second Monday in October.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Thanksgiving'
    FROM (
      SELECT id, date_value, row_number() over(partition by year order by day_of_month asc) as num
      FROM calendar_dates
      WHERE month_of_year = 10 and day_of_week = 1
    ) mondays
    WHERE calendar_dates.id = mondays.id AND mondays.num = 2;
  `);

  // Remembrance Day - November 11.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Remembrance Day'
    WHERE month_of_year = 11 AND day_of_month = 11;
  `);

  // Christmas Day - December 25.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = true, holiday = 'Christmas Day'
    WHERE month_of_year = 12 AND day_of_month = 25;
  `);

  // Optional holidays

  // Easter Monday - Friday before Easter (moon cycles, etc...)
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = false, holiday = 'Easter Monday'
    WHERE id IN (
      20200413, 20210405, 20220418, 20230410, 20240401, 20250421, 20260406, 20270329, 20280417, 20290402,
      20300422, 20310414, 20320329, 20330422, 20340410, 20350326, 20360414, 20370406, 20380426, 20390411,
      20400402, 20410422, 20420407, 20430330, 20440418, 20450410, 20460326, 20470415, 20480406, 20490419
    );
  `);

  // Heritage Day - first Monday in August.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = false, holiday = 'Heritage Day'
    FROM (
      SELECT id, date_value, row_number() over(partition by year order by day_of_month asc) as num
      FROM calendar_dates
      WHERE month_of_year = 8 and day_of_week = 1
    ) mondays
    WHERE calendar_dates.id = mondays.id AND mondays.num = 1;
  `);

  // Boxing Day - December 26.
  schema.raw(`
    UPDATE calendar_dates
    SET is_holiday = true, is_stat_holiday = false, holiday = 'Boxing Day'
    WHERE month_of_year = 12 AND day_of_month = 26;
  `);

  // Christmas closure - some really arbitrary rules...
  schema.raw(`
    DO $$
    DECLARE
      christmas record;
      closures integer[];
    BEGIN
      FOR christmas IN SELECT year, day_of_week FROM calendar_dates WHERE holiday = 'Christmas Day'
      LOOP
        -- When Christmas falls on
        CASE christmas.day_of_week
        -- Monday
        WHEN 1 THEN closures := '{28, 29}';
        -- Tuesday
        WHEN 2 THEN closures := '{27, 28, 31}';
        -- Wednesday
        WHEN 3 THEN closures := '{24, 30, 31}';
        -- Thursday
        WHEN 4 THEN closures := '{29, 30, 31}';
        -- Friday
        WHEN 5 THEN closures := '{29, 30, 31}';
        -- Saturday
        WHEN 6 THEN closures := '{29, 30, 31}';
        -- Sunday
        WHEN 7 THEN closures := '{29, 30}';
        ELSE
        END CASE;

        UPDATE calendar_dates
        SET is_holiday = true, holiday = 'Christmas Closure'
        WHERE year = christmas.year
          AND month_of_year = 12
          AND day_of_month = ANY(closures);
      END LOOP;
    END; $$
  `);

  // Business days - anything not a weekend or a holiday.
  schema.raw(`
    UPDATE calendar_dates
    SET is_business_day = true
    WHERE is_weekend = false AND is_holiday = false
  `);

  return schema;
};

exports.down = function (knex) {
  // No down for this migration.
};
