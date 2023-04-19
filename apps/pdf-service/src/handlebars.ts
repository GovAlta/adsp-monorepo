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

  async populateFileList(token: string): Promise<File[]> {
    const headers = {
      headers: { Authorization: `Bearer ${token}` },
    };

    return new Promise((resolve, reject) => {
      console.log(JSON.stringify(headers) + ' <headers');
      axios
        .get(
          `${this.fileServiceCache.get(
            'fileServiceUrl'
          )}file/v1/files?tenantId=urn:ads:platform:tenant-service:v2:/tenants/63f54755a1f047f190ab5882`,
          headers
        )
        .then((response) => {
          this.fileList.set('fileList', response.data.results);
          console.log(JSON.stringify(this.fileList, getCircularReplacer()) + ' <responseresponseresponseresponse');
          resolve(response.data.results);
        })
        .catch((error) => {
          console.log(JSON.stringify(error) + '<---QQQ');
          //resolve("42");
          console.error(error);
        });
    });
  }

  getTemplateFunction(template: string, channel?: string) {
    console.log(JSON.stringify(channel) + '<channel');
    const styledTemplate = getTemplateBody(template, channel || 'pdf', {});

    console.log(JSON.stringify(this.token) + '<----this.token0');

    //const newToken = this.token;

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

      //console.log(JSON.stringify(newToken) + '<----this.token (newtoken)');

      // if (newToken) {
      try {
        console.log(JSON.stringify(value) + '<-valXZue');
        console.log(JSON.stringify(hash) + '<-hash');

        const valueArray = value.split('.');

        value = valueArray[valueArray.length - 1];

        console.log(JSON.stringify(value) + '<-valXZue2');
        console.log(JSON.stringify(valueArray) + '<-valueArray22');

        //  const type = valueArray[valueArray.length - 2];

        console.log(JSON.stringify(this, getCircularReplacer()) + '<this--------');

        //console.log(JSON.stringify(type,getCircularReplacer()) + "<typetype--------")

        if (valueArray.find((v) => v === 'fileId')) {
          console.log(JSON.stringify('fileId') + '<fileId--------');
          // https://file-service.adsp-dev.gov.ab.ca/file/v1/files/87b954b4-6691-4498-9bc9-c3aee332f8da/download
          return `${this.fileServiceCache.get('fileServiceUrl')}file/v1/files/${value}/download`;
          // file-service
          // file host is resolved using the directory service
        } else if (valueArray.find((v) => v === 'name')) {
          // const filesData = JSON.parse(fileServiceCache.get('filesData'));
          console.log('nameeee');
          console.log(JSON.stringify(this.fileList.get('fileList')) + '<filesDatafilesData');
          console.log('nameeee2');

          const id = (this.fileList.get('fileList') as unknown as Array<any>).find(
            (file) => file.filename === value
          ).id;
          console.log(JSON.stringify(id) + '<-------id');
          return id;

          console.log(JSON.stringify('name') + '<name--------');
          // const headers = {
          //   headers: { Authorization: `Bearer ${newToken}` },
          // };

          try {
            //return axiosGet(headers,value);
          } catch (e) {
            console.error(JSON.stringify(e) + '<---eee');
          }

          //const x =
          // return (

          //)

          // return {
          //  x
          // }

          // https://file-service.adsp-dev.gov.ab.ca/file/v1/files/87b954b4-6691-4498-9bc9-c3aee332f8da/download
          //  ------return `${fileServiceCache.get('fileServiceUrl')}file/v1/files/${id}/download`;
          // file-service
          // file host is resolved using the directory service
        } else if (valueArray.find((v) => v === 'urn')) {
          // https://file-service.adsp-dev.gov.ab.ca/file/v1/files/87b954b4-6691-4498-9bc9-c3aee332f8da/download
          return `${this.fileServiceCache.get('fileServiceUrl')}file/v1/files/${value}/download`;
          // file-service
          // file host is resolved using the directory service
        }
      } catch (err) {
        // If this fails, then just fallback to default.
      }
      return value;
      //}
    });

    console.log("we're gonna compile now");

    return handlebars.compile(styledTemplate);
  }
}

// const axiosGet = async (headers, value) => {
//   console.log("asiosget")
//   console.log(JSON.stringify(headers) + "<>header")

//   const x = await axios.get(`${this.fileServiceCache.get('fileServiceUrl')}file/v1/files`,headers).then((files) => {
//       console.log(JSON.stringify(files) + "<-------files")

//       const id = (files as unknown as Array<any>).find((file) => file.filename === value).id
//       console.log(JSON.stringify(id) + "<-------id")

//       return (id)
//     })
//   return x;
// }

export function createTemplateService(directory: ServiceDirectory): TemplateService {
  console.log('we are creating template service');
  return new HandlebarsTemplateService(directory);
}

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
