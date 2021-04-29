import { connect, connection } from 'mongoose';
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

export const createRepositories = async ({ logger, ...props }: MongoRepositoryProps): Promise<Repositories> => {
  const mongoConnectionString = `${props.MONGO_URI}/${props.MONGO_DB}`;

  const mongoInst = await connect(mongoConnectionString, {
    user: props.MONGO_USER,
    pass: props.MONGO_PASSWORD,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  logger.info(`Connected to MongoDB at: ${mongoConnectionString}`);
  const healthRepository = new MongoHealthRepository();

  return Promise.resolve({
    serviceStatusRepository: healthRepository,
    isConnected: () => connection.readyState === mongoInst.connection.states.connected,
  });
};
