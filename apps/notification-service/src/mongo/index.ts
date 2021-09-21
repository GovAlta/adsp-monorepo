import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { Repositories } from '../notification';
import { MongoSubscriptionRepository } from './subscription';

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
            subscriptionRepository: new MongoSubscriptionRepository(),
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
