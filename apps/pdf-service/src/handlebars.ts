import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';
import { getTemplateBody } from '@core-services/notification-shared';
import { ServiceDirectory, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as NodeCache from 'node-cache';

import { File } from './pdf/types';

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
  private fileServiceUrl: string;
  private fileList: NodeCache;
  private token: string;

  fileServiceCache: NodeCache;

  constructor(private readonly directory: ServiceDirectory) {
    this.fileServiceCache = new NodeCache({
      stdTTL: 0,
      useClones: false,
    });

    this.fileList = new NodeCache({
      stdTTL: 0,
      useClones: false,
    });

    this.directory.getServiceUrl(adspId`urn:ads:platform:file-service`).then((result) => {
      this.fileServiceCache.set('fileServiceUrl', result.toString());
    });
  }

  setTenantToken(token: string) {
    this.token = token;
  }

  getTenantToken(): string {
    return this.token;
  }

  getFileServiceCache(): NodeCache {
    return this.fileServiceCache;
  }

  async populateFileList(token: string, tenantIdValue: string): Promise<File[]> {
    const headers = {
      headers: { Authorization: `Bearer ${token}` },
    };

    return new Promise((resolve) => {
      axios
        .get(`${this.fileServiceCache.get('fileServiceUrl')}file/v1/files?tenantId=${tenantIdValue}`, headers)
        .then((response) => {
          this.fileList.set('fileList', response.data.results);
          resolve(response.data.results);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  getTemplateFunction(template: string, channel?: string) {
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});

    const fileList = this.fileList.get('fileList');
    const fileServiceUrl = this.fileServiceCache.get('fileServiceUrl');

    handlebars.registerHelper('fileId', function (value: string) {
      let returnValue = '';

      try {
        const valueArray = value.split('.');

        if (valueArray.find((v) => v === 'fileId')) {
          returnValue = valueArray[valueArray.length - 1];
        } else if (valueArray.find((v) => v === 'name')) {
          const fileName = valueArray[valueArray.length - 2] + '.' + valueArray[valueArray.length - 1];

          const id = (fileList as Array<File>).find((file) => {
            return file.filename === fileName;
          })?.id;

          returnValue = id;
        } else if (valueArray.find((v) => v === 'urn')) {
          const uri = valueArray[valueArray.length - 1];
          const id = (fileList as Array<File>).find((file) => {
            return file.urn === uri;
          })?.id;

          returnValue = id;
        } else {
          return value;
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
