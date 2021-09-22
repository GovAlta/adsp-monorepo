import { connect, connection, ConnectionStates } from 'mongoose';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { Repositories } from '../file';
import { MongoFileSpaceRepository } from './space';
import { MongoFileRepository } from './file';

interface MongoRepositoryProps {
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  logger: Logger;
}

export const createRepositories = ({
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  logger,
}: MongoRepositoryProps): Promise<Repositories> =>
  new Promise<Repositories>((resolve, reject) => {
    const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}`;
    connect(
      mongoConnectionString,
      {
        auth: { username: MONGO_USER, password: MONGO_PASSWORD },
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          const cache = new NodeCache({ stdTTL: 86400, useClones: false });
          const spaceRepository = new MongoFileSpaceRepository(logger, cache);
          const fileRepository = new MongoFileRepository(spaceRepository);
          resolve({
            spaceRepository,
            fileRepository,
            // NOTE: Typescript seems to have issues with exported enums where enum is null at runtime.
            // Possible that express js module doesn't actually export anything for ConnectionStates and
            // type definition is wrong (or intended to be substituted at transpile time... but doesn't happen)
            isConnected: () => connection.readyState === (ConnectionStates?.connected || 1),
          });

          logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
        }
      }
    );
  });
