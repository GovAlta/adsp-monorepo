import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { Template, TemplateService } from './notification';

handlebars.registerHelper('formatDate', function (value: unknown, { hash = {} }: { hash: Record<string, string> }) {
  try {
    if (value instanceof Date) {
      value = DateTime.fromJSDate(value).toFormat(hash.format || 'ff');
    } else if (typeof value === 'string') {
      value = DateTime.fromISO(value).toFormat(hash.format || 'ff');
    }
  } catch (err) {
    // If this fails, then just fallback to default.
  }
  return value;
});

class HandlebarsTemplateService implements TemplateService {
  generateMessage(template: Template, data: unknown) {
    return {
      subject: handlebars.compile(template.subject)(data),
      body: handlebars.compile(template.body)(data),
    };
  }
}

export function createTemplateService(): TemplateService {
  return new HandlebarsTemplateService();
}
