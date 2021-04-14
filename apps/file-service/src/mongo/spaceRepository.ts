import * as NodeCache from 'node-cache';
import { MongoFileSpaceRepository } from './space';
import { createLogger } from '@core-services/core-common';
import { environment } from '../environments/environment';

export const fileSpaceRepository = () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  return new MongoFileSpaceRepository(logger, cache);
};
