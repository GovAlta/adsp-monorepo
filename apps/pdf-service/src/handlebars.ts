import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';

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

class HandlebarsTemplateService implements TemplateService {
  getTemplateFunction(template: string) {
    return handlebars.compile(template);
  }
}

export function createTemplateService(): TemplateService {
  return new HandlebarsTemplateService();
}
