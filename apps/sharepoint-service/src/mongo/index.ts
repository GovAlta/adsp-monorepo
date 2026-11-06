import { connect, connection } from 'mongoose';
import { Logger } from 'winston';
import { CredentialRepository } from '../sharepoint/credentials';
import { MongoCredentialRepository } from './credential';

interface MongoProps {
  MONGO_URI: string;
  MONGO_DB: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_TLS: boolean;
  logger: Logger;
}

export const connectMongo = async ({
  MONGO_URI,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_TLS,
  logger,
}: MongoProps): Promise<{ credentialRepository: CredentialRepository; isConnected: () => boolean }> => {
  const uri = `${MONGO_URI}/${MONGO_DB}?retryWrites=false&ssl=${MONGO_TLS}`;
  await connect(uri, { user: MONGO_USER || undefined, pass: MONGO_PASSWORD || undefined, autoIndex: true });
  logger.info(`Connected to MongoDB at: ${uri}`);
  return { credentialRepository: new MongoCredentialRepository(), isConnected: () => connection.readyState === 1 };
};
