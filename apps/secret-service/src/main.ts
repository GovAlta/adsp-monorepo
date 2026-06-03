import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createSecretRouter } from './secret';

const logger = createLogger('secret-service', environment.LOG_LEVEL);

const app = express();

app.use(cors());
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Bind Secret router
app.use('/secret/v1/secrets', createSecretRouter({ logger }));

const port = environment.PORT;

const server = app.listen(port, () => {
  logger.info(`Secret service listening at http://localhost:${port}`);
});

server.on('error', (err) => {
  logger.error(`Error starting server: ${err}`);
});
