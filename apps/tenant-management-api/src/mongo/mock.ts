import { connect, ConnectionOptions, connection } from 'mongoose';
import { logger } from '../middleware/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = new MongoMemoryServer();

export const disconnect = async (): Promise<void> => {
  logger.info('MongoDB disconnected...');
  await connection.close();
  await mongod.stop();
};

export const createMockMongoServer = async (): Promise<void> => {
  const mockMongoUri = await mongod.getUri();
  const options: ConnectionOptions = {};

  try {
    await connect(mockMongoUri, options);
  } catch (err) {
    logger.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};
