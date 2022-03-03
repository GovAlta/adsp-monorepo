import { connect, connection, ConnectionStates } from 'mongoose';
import { Logger } from 'winston';
import { Repositories } from '../notification';
import { BotRepository, SlackRepository } from '../provider';
import { MongoBotRepository } from './bot';
import { MongoSlackInstallationStore } from './slack';
import { MongoSubscriptionRepository } from './subscription';

interface MongoRepositoryProps {
  logger: Logger;
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
}

export const createRepositories = ({
  logger,
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
}: MongoRepositoryProps): Promise<
  Repositories & { slackRepository: SlackRepository; botRepository: BotRepository }
> =>
  new Promise((resolve, reject) => {
    const mongoConnectionString = `${MONGO_URI}/${MONGO_DB}?retryWrites=false&ssl=${MONGO_TLS}`;
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
          resolve({
            subscriptionRepository: new MongoSubscriptionRepository(),
            slackRepository: new MongoSlackInstallationStore(logger),
            botRepository: new MongoBotRepository(logger),
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
