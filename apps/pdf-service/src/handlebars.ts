import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { TemplateService } from './pdf';
import { getTemplateBody } from '@core-services/notification-shared';
import { ServiceDirectory, TenantService, AdspId, adspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { bool } from 'envalid';
import { File } from './pdf/types';

const serviceId = AdspId.parse(environment.CLIENT_ID);
const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
const logger = createLogger('form-service', environment.LOG_LEVEL);

// (async () => {
//   try {
//     const { directory, tenantService, ...sdkCapabilities } = await initializePlatform(
//       {
//         serviceId,
//         displayName: 'Verify service',
//         description: 'Service for generating and verifying codes.',
//         clientSecret: environment.CLIENT_SECRET,
//         accessServiceUrl,
//         directoryUrl: new URL(environment.DIRECTORY_URL),
//       },
//       { logger }
//     );
//   } catch (e) {
//     // Deal with the fact the chain failed
//   }
// })();

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

// const fileServiceCache = new NodeCache({
//   stdTTL: 0,
//   useClones: false,
// });

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
      console.log(JSON.stringify(result) + '<-------result');
      this.fileServiceCache.set('fileServiceUrl', result.toString());
      const headers = {
        headers: { Authorization: `Bearer ${this.token}` },
      };
      console.log(JSON.stringify(this.token) + '<-------this.token');
      console.log(JSON.stringify(`${result}file/v1/files`) + '<-------`${result}file/v1/files`');
      // try {
      //   axios.get(`${result}file/v1/files`,headers).then((files) => {
      //     console.log(JSON.stringify(files) + "<-------files")
      //   fileServiceCache.set('filesData', JSON.stringify(files.toString()));
      // })} catch (e) {
      //   console.error(JSON.stringify(e) + "<---eee")
      // }
    });
  }

  setTenantToken(token: string) {
    console.log(JSON.stringify(token) + '<token-------');
    this.token = token;
    console.log(JSON.stringify(this.token) + '<this.tokenthis.token');
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
    console.log(JSON.stringify(channel) + '<channel');
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});

    console.log(JSON.stringify(this.token) + '<----this.token0');

    const fileList = this.fileList.get('fileList');
    const fileServiceUrl = this.fileServiceCache.get('fileServiceUrl');

    handlebars.registerHelper('fileId', function (value: string, { hash = {} }: { hash: Record<string, string> }) {
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return;
            }
            seen.add(value);
          }
          return value;
        };
      };

      let returnValue = '';

      try {
        const valueArray = value.split('.');

        if (valueArray.find((v) => v === 'fileId')) {
          returnValue = value;
        } else if (valueArray.find((v) => v === 'name')) {
          const fileName = valueArray[valueArray.length - 2] + '.' + valueArray[valueArray.length - 1];

          const id = (fileList as unknown as Array<any>).find((file) => {
            return file.filename === fileName;
          })?.id;
          console.log(JSON.stringify(id) + '<-------id');
          returnValue = id;
        } else if (valueArray.find((v) => v === 'urn')) {
          console.log('urn  ');

          const uri = valueArray[valueArray.length - 1];

          const id = (fileList as unknown as Array<any>).find((file) => {
            return file.urn === uri;
          })?.id;

          returnValue = id;

          returnValue = id;
        } else {
          return value;
        }
      } catch (err) {
        console.error(err);
      }

      return `${fileServiceUrl}file/v1/files/${returnValue}/download?unsafe=true`;
    });

    console.log("we're gonna compile now");

    return handlebars.compile(styledTemplate);
  }
}

export function createTemplateService(directory: ServiceDirectory): TemplateService {
  return new HandlebarsTemplateService(directory);
}
