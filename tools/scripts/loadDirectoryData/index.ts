import { connect } from 'mongoose';
import { createLogger, format, transports } from 'winston';
import { bootstrapDirectory } from '../../../apps/tenant-management-api/src/directory';
import { logger } from '../../../apps/tenant-management-api/src/middleware/logger';

const file = process.argv[2] || './directory.platform.json';
const mongoUri = process.argv[3] || `mongodb://localhost:27017`;

const loadDirectory = async () => {
  const mongoose = await connect(`${mongoUri}/tenantDb`, {
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  const logger = createLogger({
    level: 'debug',
    format: format.combine(format.timestamp(), format.colorize(), format.simple()),
    transports: [new transports.Console()],
  });

  await bootstrapDirectory(logger, file);
  await mongoose.disconnect();
};

loadDirectory().catch((err) => {
  logger.error(`Error encountered during load. ${err}`);
  process.exit(1);
});
