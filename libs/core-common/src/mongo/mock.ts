import { connect as _connect, connection, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = new MongoMemoryServer();

/**
 * Disconnects from the mock mongo instance
 *  afterEach(async (done) => {
 *    await disconnect();
 *    done();
 *  });
 */

export const disconnect = async (): Promise<void> => {
  await connection.close();
  await mongod.stop();
};

/**
 * Connects to a mock mongo instance
 *  beforeEach(async (done) => {
 *    await connect();
 *    done();
 *  });
 */
export const connect = async (): Promise<typeof import('mongoose')> => {
  const mockMongoUri = await mongod.getUri();
  const options = {};

  try {
    return await _connect(mockMongoUri, options);
  } catch (err) {
    console.error(`MockMongoDB has error, ${err.message} will exit ...`);
  }
};

export function generateId(): string {
  return Types.ObjectId().toHexString();
}

interface RepoSaver<T> {
  save(data: T): Promise<T>;
}

// type RepoSaveType<T> = Pick<T, Exclude<keyof T, 'id'>> & { id?: string };
type RepoSaveType<T> = Partial<T> & { id?: string };

// TODO: should this be _id or id?
export function createMockData<T>(repo: RepoSaver<T>, data: RepoSaveType<T>[]): Promise<T[]> {
  return Promise.all(
    data.map(async (entity: RepoSaveType<T>) => {
      entity.id = generateId();
      return await repo.save((entity as unknown) as T);
    })
  );
}
