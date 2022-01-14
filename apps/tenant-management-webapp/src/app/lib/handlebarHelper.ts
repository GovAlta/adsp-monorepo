import * as handlebars from 'handlebars/dist/cjs/handlebars';
import { DateTime } from 'luxon';
const TIME_ZONE = 'America/Edmonton';

handlebars.registerHelper('formatDate', function (value: unknown, { hash = {} }: { hash: Record<string, string> }) {
  try {
    if (value instanceof Date) {
      value = DateTime.fromJSDate(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    } else if (typeof value === 'string') {
      value = DateTime.fromISO(value)
        .setZone(TIME_ZONE)
        .toFormat(hash.format || 'ff ZZZZ');
    }
  } catch (err) {
    // If this fails, then just fallback to default.
  }
  return value;
});

// eslint-disable-next-line
export const generateMessage = (template, data) => {
  return handlebars.compile(template)(data);
};
