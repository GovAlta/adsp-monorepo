import * as data from './directory.json';
import { DirectoryMap, createDirectory } from './model/directory';
import Directory from './model/directory';
import { logger } from '../../../middleware/logger';
import { ApiError } from '../../util/apiError';
import * as HttpStatusCodes from 'http-status-codes';
import {
  validateUrn,
  validateHostname,
  validateVersion,
  validatePath,
} from './util/patternUtil';

export interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}
export interface Response {
  url?: string;
  urn?: string;
}
const URN_SEPARATOR = ':';
const HTTPS = 'https://';

const getName = (directory, core: string) => {
  for (const obj of directory) {
    if (obj['name'] === core) {
      return obj['services'];
    }
  }
  return null;
};

const getUrn = (component: URNComponent) => {
  let urn = `${component.scheme}:${component.nic}:${component.core}:${component.service}`;
  urn = component.apiVersion ? `${urn}:${component.apiVersion}` : urn;
  urn = component.resource ? `${urn}:${component.resource}` : urn;
  return urn;
};

const isStartWithHttp = (service: string) => {
  return service.toLowerCase().startsWith('http');
};
const getUrlResponse = (services, component) => {
  let host = null;
  if (services) {
    for (const service of services) {
      if (service['service'] === component.service) {
        host = service['host'];
        break;
      }
    }
  }

  //construct returned url
  if (host) {
    const discoveryRes: Response = {};
    discoveryRes.urn = getUrn(component);

    let responseUrl = component.apiVersion
      ? `${HTTPS}${host}/application/${component.apiVersion}`
      : `${HTTPS}${host}`;

    responseUrl = component.resource
      ? `${responseUrl}${component.resource}`
      : responseUrl;
    discoveryRes.url = responseUrl;
    return discoveryRes;
  }
  return new ApiError(
    HttpStatusCodes.BAD_GATEWAY,
    'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
  );
};
const validateServices = (services) => {
  for (const service of services) {
    if (!validateHostname(service['host'])) {
      return new ApiError(
        HttpStatusCodes.BAD_REQUEST,
        'Host format not correct!'
      ).getJson();
    }
  }
};

export const discovery = async (urn) => {
  //reslove the urn to object
  logger.info(`Starting discover URL for urn ${urn}`);
  const component: URNComponent = {};
  const urnArray = urn.toLowerCase().split(URN_SEPARATOR);

  if (urnArray.length > 3) {
    component.scheme = urnArray[0];
    component.nic = urnArray[1];
    component.core = urnArray[2];
    component.service = urnArray[3];

    if (!validateUrn(getUrn(component))) {
      return new ApiError(
        HttpStatusCodes.BAD_REQUEST,
        'Please give right format URN! urn format should looks like urn:ads:{tenant|core}:{service}'
      ).getJson();
    }

    if (urnArray[4]) {
      if (validateVersion(urnArray[4])) {
        component.apiVersion = urnArray[4];
        if (urnArray[5] && validatePath(urnArray[5])) {
          component.resource = urnArray[5];
        }
      }

      if (validatePath(urnArray[4])) {
        component.resource = urnArray[4];
      }
    }

    try {
      let directory: DirectoryMap[] = await Directory.find();

      if (!directory || directory.length === 0) {
        // No directory in mongo db will read from json file.

        // eslint-disable-next-line
        const directoryJson = (data as any).default;

        createDirectory(directoryJson);

        const services = getName(directoryJson, component.core);
        return getUrlResponse(services, component);
      }

      // get url from mongo
      directory = await Directory.find({ name: component.core });
      const services = directory[0]['services'];

      return getUrlResponse(services, component);
    } catch (err) {
      return new ApiError(
        HttpStatusCodes.BAD_REQUEST,
        'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
      );
    }
  }

  return new ApiError(
    HttpStatusCodes.BAD_REQUEST,
    'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
  );
};

export const getDirectories = async () => {
  logger.info('Starting get directory from mongo db...');
  try {
    const response = [];

    const directories: DirectoryMap[] = await Directory.find({});
    if (directories && directories.length > 0) {
      for (const directory of directories) {
        const services = directory['services'];
        for (const service of services) {
          const element: Response = {};
          const component: URNComponent = {
            scheme: 'urn',
            nic: 'ads',
            core: directory['name'],
            service: service['service'],
          };

          element.urn = getUrn(component);
          const serviceName: string = service['host'].toString();
          element.url = isStartWithHttp(serviceName)
            ? serviceName
            : `${HTTPS}${serviceName}`;
          response.push(element);
        }
      }
    }
    return response;
  } catch (err) {
    return new ApiError(
      HttpStatusCodes.BAD_REQUEST,
      'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
    );
  }
};

export const addDirectory = async (directories) => {
  logger.info('directory service add updateDirectory');
  try {
    const services = directories['services'];
    validateServices(services);

    const directory: DirectoryMap[] = await Directory.find({
      name: directories['name'],
    });

    // Create
    await Directory.create(
      JSON.parse(JSON.stringify(directories).toLowerCase())
    );
    return HttpStatusCodes.CREATED;
  } catch (err) {
    return new ApiError(
      HttpStatusCodes.BAD_REQUEST,
      'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
    );
  }
};

export const updateDirectory = async (directories) => {
  logger.info('directory service add updateDirectory');
  try {
    const services = directories['services'];
    validateServices(services);

    const directory: DirectoryMap[] = await Directory.find({
      name: directories['name'],
    });

    if (directory && directory.length > 0) {
      // Update
      await Directory.findOneAndUpdate(
        { name: directories['name'] },
        {
          services: JSON.parse(
            JSON.stringify(directories['services']).toLowerCase()
          ),
        },
        { new: true }
      );
      return HttpStatusCodes.CREATED;
    }
  } catch (err) {
    return new ApiError(
      HttpStatusCodes.BAD_REQUEST,
      'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
    );
  }
};

export const deleteDirectory = async (name: string) => {
  try {
    logger.info(`Start delete diretory :  ${name}...`);
    await Directory.deleteOne({ name: name });

    return HttpStatusCodes.ACCEPTED;
  } catch (err) {
    return new ApiError(
      HttpStatusCodes.BAD_REQUEST,
      'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
    );
  }
};
