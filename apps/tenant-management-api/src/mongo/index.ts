import { connect, ConnectionOptions, connection } from 'mongoose';
import { logger } from '../middleware/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = new MongoMemoryServer();
import { environment } from '../environments/environment';

export const connectMongo = async () => {
  try {
    const mongoHost = environment.MONGO_URI;
    const mongoDb = environment.MONGO_DB;
    const mongoUser = environment.MONGO_USER;
    const mongoPassword = environment.MONGO_PASSWORD;

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
  await mongod.stop();
};

export const createMockMongoServer = async () => {
  const mockMongoUri = await mongod.getUri();
  const options: ConnectionOptions = {};

  try {
    await connect(mockMongoUri, options);
  } catch (err) {
    logger.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};
