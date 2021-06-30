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
}

export const createRepositories = async ({ logger, ...props }: MongoRepositoryProps): Promise<Repositories> => {
  const mongoConnectionString = `${props.MONGO_URI}/${props.MONGO_DB}`;
  logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);

  await connect(mongoConnectionString, {
    user: props.MONGO_USER,
    pass: props.MONGO_PASSWORD,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  const serviceStatusRepository = new MongoServiceStatusRepository();
  const noticeRepository = new MongoNoticeRepository();
  const endpointStatusEntryRepository = new MongoEndpointStatusEntryRepository();

  return Promise.resolve({
    serviceStatusRepository: serviceStatusRepository,
    noticeRepository: noticeRepository,
    endpointStatusEntryRepository: endpointStatusEntryRepository,
    isConnected: () => connection.readyState === 1, // FIXME: ConnectionStatus is always undefined -> ConnectionStates.connected,
  });
};

// export const createNoticeRepositories = async ({ logger, ...props }: MongoRepositoryProps): Promise<Repositories> => {
//   const mongoConnectionString = `${props.MONGO_URI}/${props.MONGO_DB}`;
//   logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);

//   await connect(mongoConnectionString, {
//     user: props.MONGO_USER,
//     pass: props.MONGO_PASSWORD,
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   });

//   const noticeRepository = new MongoNoticeRepository();

//   return Promise.resolve({
//     serviceStatusRepository: serviceStatusRepository,
//     isConnected: () => connection.readyState === 1, // FIXME: ConnectionStatus is always undefined -> ConnectionStates.connected,
//   });
// };