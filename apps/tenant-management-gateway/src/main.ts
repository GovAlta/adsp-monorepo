import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createTenantManagementRouter } from './tenant';

const logger = createLogger('tenant-management-gateway', environment.LOG_LEVEL);

const app = express();

app.use(cors());
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use('/api/tenant/v1', createTenantManagementRouter({ logger }));

const port = environment.PORT;

const server = app.listen(port, () => {
  logger.info(`Tenant management gateway listening at http://localhost:${port}`);
});

server.on('error', (err) => {
  logger.error(`Error starting server: ${err}`);
});
