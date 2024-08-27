import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { Repositories } from '../form';
import { NotificationService } from '../notification';
import { ConfigurationFormDefinitionRepository } from './definition';
import { MongoFormRepository } from './form';
import { MongoFormSubmissionRepository } from './formSubmission';

interface MongoRepositoryProps {
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
  logger: Logger;
  configurationService: ConfigurationService;
  notificationService: NotificationService;
}

export const createRepositories = ({
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
  logger,
  configurationService,
  notificationService,
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
          const definitionRepository = new ConfigurationFormDefinitionRepository(logger, configurationService);
          const formRepository = new MongoFormRepository(definitionRepository, notificationService);
          const formSubmissionRepository = new MongoFormSubmissionRepository(formRepository);
          resolve({
            formRepository,
            formSubmissionRepository,
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
