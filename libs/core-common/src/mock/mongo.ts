import { connect, connection } from 'mongoose';
import { createLogger } from '../logging';
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = new MongoMemoryServer();
const logger = createLogger('[MOCK][MONGO]', 'info');

export const disconnectMockMongo = async () => {
  logger.info('MockMongoDB disconnected...');
  await connection.close();
  await mongod.stop();
};

export const createMockMongoServer = async () => {
  const mockMongoUri = await mongod.getUri();
  const options = {};

  try {
    await connect(mockMongoUri, options);
  } catch (err) {
    logger.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};
