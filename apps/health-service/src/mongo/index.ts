import { connect, connection } from 'mongoose';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { Repositories } from '../app/repository';
import { MongoHealthRepository } from './health';

interface MongoRepositoryProps {
  logger: Logger;
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
}

export const createRepositories = ({
  logger,
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
}: MongoRepositoryProps): Promise<Repositories> =>
  new Promise((resolve, reject) => {
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
          return;
        }

        const healthRepository = new MongoHealthRepository();
        resolve({
          serviceStatusRepository: healthRepository,
          isConnected: () => connection.readyState === connection.states.connected,
        });

        logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
      }
    );
  });
