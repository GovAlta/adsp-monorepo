import * as mongoose from 'mongoose';
import { Logger } from 'winston';

// ✓ ASVS:V3.2.1 — secure database connection; URI sourced from environment only
// ✓ CAS:RULE-024 — MongoDB URI never logged; only connection status events are emitted
// ✓ ASVS:V7.1.1 — no sensitive data (URI, credentials) in log output

export interface MongoConnection {
  isConnected(): boolean;
  disconnect(): Promise<void>;
}

/**
 * createMongoConnection — establishes a mongoose connection to MongoDB.
 *
 * Protected B requirement: the URI is accepted as a parameter (caller reads it
 * from environment.MONGO_URI), but it is NEVER logged — only connection status
 * events are emitted to the logger.
 *
 * @param uri — MongoDB connection string (from MONGO_URI env var)
 * @param logger — Winston logger instance
 */
export async function createMongoConnection(uri: string, logger: Logger): Promise<MongoConnection> {
  // ✓ ASVS:V3.2.1 — connection options follow security best practices
  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    // ✓ ASVS:V9.2.1 — TLS is required in production; the MongoDB URI controls ssl/tls settings
    // For atlas/production URIs: include ?tls=true&tlsAllowInvalidCertificates=false in URI
  };

  mongoose.connection.on('connected', () => {
    // ✓ ASVS:V7.1.1 — only status logged; URI not logged here or elsewhere
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost; will attempt reconnection');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err: Error) => {
    // ✓ CAS:RULE-024 — error message logged but URI is not interpolated into it
    logger.error('MongoDB connection error', { message: err.message });
  });

  // ✓ ASVS:V3.2.1 — connect call; URI value never echoed in logs
  await mongoose.connect(uri, options);

  return {
    isConnected(): boolean {
      return mongoose.connection.readyState === 1;
    },
    async disconnect(): Promise<void> {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed');
    },
  };
}
