import { connect, ConnectionOptions, connection } from 'mongoose';
import { environment } from '../environments/environment';
import { logger } from '../middleware/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectMongo = async () => {
  try {
    const mongoHost = environment.MONGO_URI || process.env.MONGO_URI;
    const mongoDb = environment.MONGO_DB || process.env.MONGO_DB;
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

export const createMockMongoServer = async () => {
  logger.info('Start to create MockMongoDB...');
  const mongod = new MongoMemoryServer();
  const mockMongoUri = await mongod.getUri();

  logger.info(`Mondodb URI is  ${mockMongoUri}`);
  const options: ConnectionOptions = {};

  try {
    await connect(mockMongoUri, options);
    logger.info('MockMongoDB Connected...');
  } catch (err) {
    logger.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};
