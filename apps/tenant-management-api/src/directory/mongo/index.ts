import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { Repositories } from '../repository';
import { MongoDirectoryRepository } from './directory';

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
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            directoryRepository: new MongoDirectoryRepository(),
            isConnected: () => connection.readyState === ConnectionStates.connected,
          });

          logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
        }
      }
    );
  });
