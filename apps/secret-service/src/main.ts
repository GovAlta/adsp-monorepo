import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
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

const tlsCertPath = environment.TLS_CERT;
const tlsKeyPath = environment.TLS_KEY;

if (fs.existsSync(tlsCertPath) && fs.existsSync(tlsKeyPath)) {
  const tlsOptions = {
    cert: fs.readFileSync(tlsCertPath),
    key: fs.readFileSync(tlsKeyPath),
  };

  const httpsServer = https.createServer(tlsOptions, app);
  httpsServer.listen(environment.HTTPS_PORT, () => {
    logger.info(`Secret service listening on HTTPS :${environment.HTTPS_PORT} (TLS: ${tlsCertPath})`);
  });
  httpsServer.on('error', (err) => {
    logger.error(`Error starting HTTPS server: ${err}`);
  });
} else {
  logger.warn(
    `TLS certificate not found at ${tlsCertPath}; starting HTTP server on :${environment.PORT}. ` +
      'This should only occur in local development.',
  );
  const server = app.listen(environment.PORT, () => {
    logger.info(`Secret service listening on HTTP :${environment.PORT}`);
  });
  server.on('error', (err) => {
    logger.error(`Error starting server: ${err}`);
  });
}
