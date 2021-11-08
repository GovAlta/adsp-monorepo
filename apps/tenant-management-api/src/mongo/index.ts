import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { Repositories as ConfigurationRepositories } from '../configuration';
import { Repositories as DirectoryRepositories } from '../directory';
import { Repositories as TenantRepositories } from '../tenant';
import { MongoDirectoryRepository } from './directory';
import { MongoServiceOptionRepository } from './serviceOption';
import { MongoTenantRepository } from './tenant';
import { MongoTenantConfigurationRepository } from './tenantConfig';

export const disconnect = async (logger: Logger): Promise<void> => {
  logger.info('MongoDB disconnected...');
  await connection.close();
};

interface MongoRepositoryProps {
  logger: Logger;
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
}

type Repositories = ConfigurationRepositories & DirectoryRepositories & TenantRepositories;

export const createRepositories = ({
  logger,
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
}: MongoRepositoryProps): Promise<Repositories> =>
  new Promise((resolve, reject) => {
    const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}?ssl=${MONGO_TLS}`;
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
            tenantRepository: new MongoTenantRepository(),
            serviceConfigurationRepository: new MongoServiceOptionRepository(),
            tenantConfigurationRepository: new MongoTenantConfigurationRepository(),
            directoryRepository: new MongoDirectoryRepository(),
            isConnected: () => connection.readyState === ConnectionStates.connected,
          });

          logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
        }
      }
    );
  });
