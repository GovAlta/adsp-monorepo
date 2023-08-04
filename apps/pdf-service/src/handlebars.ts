import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';
import { getTemplateBody } from '@core-services/notification-shared';
import { ServiceDirectory, adspId } from '@abgov/adsp-service-sdk';
import { validate } from 'uuid';
import * as NodeCache from 'node-cache';

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
  fileServiceCache: NodeCache;

  constructor(private readonly directory: ServiceDirectory) {
    this.fileServiceCache = new NodeCache({
      stdTTL: 0,
      useClones: false,
    });

    this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`).then((result) => {
      this.fileServiceCache.set('fileServiceUrl', result.toString());
    });
  }

  getTemplateFunction(template: string, channel?: string) {
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});

    const fileServiceUrl = this.fileServiceCache.get('fileServiceUrl');

    handlebars.registerHelper('fileId', function (value: string) {
      let returnValue = '';

      try {
        if (typeof value === 'string' && value.slice(0, 4) === 'urn:') {
          if (value.indexOf('urn:ads:platform:file-service') !== -1) {
            returnValue = value.split('/')[value.split('/').length - 1];
          } else {
            return null;
          }
        } else if (validate(value)) {
          returnValue = value;
        } else {
          return null;
        }
      } catch (err) {
        console.error(err);
      }

      return `${fileServiceUrl}file/v1/files/${returnValue}/download?unsafe=true&embed=true`;
    });

    return handlebars.compile(styledTemplate);
  }
}

export function createTemplateService(directory: ServiceDirectory): TemplateService {
  return new HandlebarsTemplateService(directory);
}
