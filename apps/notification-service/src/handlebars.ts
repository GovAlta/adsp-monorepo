import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { Template, TemplateService } from './notification';
import { getTemplateBody } from '@core-services/shared';
import type { DomainEvent } from '@core-services/core-common';

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
  getServiceName = (data: unknown) => {
    let serviceName = '';

    if ((data as DomainEvent) !== undefined) {
      const dataItem = data as DomainEvent;

      if (dataItem.name || dataItem.namespace) {
        serviceName = `${dataItem?.namespace}:${dataItem?.name}`;
      }
    }
    return serviceName;
  };

  generateMessage(template: Template, data: unknown) {
    return {
      subject: handlebars.compile(template.subject)(data),
      body: handlebars.compile(getTemplateBody(template.body.toString()))(data),
    };
  }
}

export function createTemplateService(): TemplateService {
  return new HandlebarsTemplateService();
}
