import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createSharePointRouter } from './sharepoint';

const logger = createLogger('sharepoint-service', environment.LOG_LEVEL);

const app = express();

app.use(cors());
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/sharepoint/v1/sharepoint', createSharePointRouter({ logger }));

const port = environment.PORT;

const server = app.listen(port, () => {
  logger.info(`SharePoint service listening at http://localhost:${port}`);
});

server.on('error', (err) => {
  logger.error(`Error starting server: ${err}`);
});
