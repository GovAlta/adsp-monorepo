import { connect, ConnectionOptions, connection } from 'mongoose';
import { environment } from '../environments/environment';
import { logger } from '../middleware/logger';

export const connectMongo = async () => {
  try {
     const mongoHost = environment.MONGO_URI || process.env.MONGO_URI;
     const mongoDb = environment.MONGO_DB || process.env.MONGO_DB;

    const mongoURI = `${mongoHost}/${mongoDb}`;
    logger.info(`Mondodb URI is  ${mongoURI}`);
    logger.info(`environment.MONGO_URI   ${mongoHost}`);
    const options: ConnectionOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
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
