import { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { FileStorageProvider, Repositories } from '../file';
import { MongoFileRepository } from './file';
import { ConfigurationFileTypeRepository } from './type';

interface MongoRepositoryProps {
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
  serviceId: AdspId;
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  storageProvider: FileStorageProvider;
}

export const createRepositories = ({
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
  serviceId,
  logger,
  tokenProvider,
  configurationService,
  storageProvider,
}: MongoRepositoryProps): Promise<Repositories> =>
  new Promise<Repositories>((resolve, reject) => {
    const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}?retryWrites=false&ssl=${MONGO_TLS}`;
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
          const typeRepository = new ConfigurationFileTypeRepository(serviceId, tokenProvider, configurationService);
          logger.info(`File service configuration fetched: ${JSON.stringify(typeRepository, null, 4)}`);
          const fileRepository = new MongoFileRepository(storageProvider, typeRepository);
          resolve({
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
