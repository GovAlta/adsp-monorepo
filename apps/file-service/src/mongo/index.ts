import { connect, connection } from 'mongoose';
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

export const createRepositories = ({ MONGO_URI, MONGO_DB, MONGO_USER, MONGO_PASSWORD, logger }: MongoRepositoryProps) =>
  new Promise<Repositories>((resolve, reject) => {
    const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}`;
    connect(
      mongoConnectionString,
      {
        user: MONGO_USER,
        pass: MONGO_PASSWORD,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
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
            isConnected: () => connection.readyState === connection.states.connected,
          });

          logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
        }
      }
    );
  });
