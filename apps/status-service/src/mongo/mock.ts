import { connect, connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = new MongoMemoryServer();

export const disconnectMockMongo = async (): Promise<void> => {
  await connection.close();
  await mongod.stop();
};

export const createMockMongoServer = async (): Promise<typeof import('mongoose')> => {
  const mockMongoUri = await mongod.getUri();
  const options = {};

  try {
    return await connect(mockMongoUri, options);
  } catch (err) {
    console.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};
