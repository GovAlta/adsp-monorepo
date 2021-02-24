import { connect, ConnectionOptions, connection } from 'mongoose';
import { environment } from '../environments/environment';
import { logger } from '../middleware/logger';

export const connectMongo = async (isTest = false) => {
  try {
    const mongoHost = environment.MONGO_URI || process.env.MONGO_URI;
    const DbNameInEnv = environment.MONGO_DB || process.env.MONGO_DB;
    const mongoDb = isTest ? DbNameInEnv + 'Test' : DbNameInEnv;
    const mongoUser = environment.MONGO_USER || process.env.MONGO_USER;
    const mongoPassword =
      environment.MONGO_PASSWORD || process.env.MONGO_PASSWORD;

    const mongoURI = `${mongoHost}/${mongoDb}`;

    logger.info(`Mondodb URI is  ${mongoURI}`);

    const options: ConnectionOptions = {
      user: mongoUser,
      pass: mongoPassword,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    };

    await connect(mongoURI, options);
    logger.info('MongoDB Connected...');
  } catch (err) {
    // Exit process with failure
    logger.error(`MongoDB has error, ${err.message} will exit ...`);
    process.exit(1);
  }
};

export const disconnect = async () => {
  logger.info('MongoDB diconnected...');
  await connection.close();
};
