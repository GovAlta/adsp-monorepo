import { connect, connection } from 'mongoose';
import { Logger } from 'winston';
import { Repositories } from '../app/repository';
import MongoEndpointStatusEntryRepository from './endpointStatusEntry';
import { MongoServiceStatusRepository } from './serviceStatus';
import { MongoNoticeRepository } from './notice';

interface MongoRepositoryProps {
  logger: Logger;
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
}

export const createRepositories = async ({
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
  logger,
}: MongoRepositoryProps): Promise<Repositories> => {
  const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}?retryWrites=false&ssl=${MONGO_TLS}`;
  logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);

  await connect(mongoConnectionString, {
    user: MONGO_USER,
    pass: MONGO_PASSWORD,
    autoIndex: true,
  });

  const serviceStatusRepository = new MongoServiceStatusRepository(logger);
  const noticeRepository = new MongoNoticeRepository(logger);
  const endpointStatusEntryRepository = new MongoEndpointStatusEntryRepository(logger);

  return Promise.resolve({
    serviceStatusRepository: serviceStatusRepository,
    noticeRepository: noticeRepository,
    endpointStatusEntryRepository: endpointStatusEntryRepository,
    isConnected: () => connection.readyState === 1, // FIXME: ConnectionStatus is always undefined -> ConnectionStates.connected,
  });
};
