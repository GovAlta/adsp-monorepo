import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { Logger } from 'winston';
import { createSecretRouter } from './secret';

export interface SecretServiceEnvironment {
  PORT: number;
  HTTPS_PORT: number;
  TLS_CERT: string;
  TLS_KEY: string;
}

interface FileSystem {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string) => string | Buffer;
}

interface Server {
  listen: (port: number, callback: () => void) => void;
  on: (event: 'error', listener: (err: Error) => void) => void;
}

interface HttpsModule {
  createServer: (options: https.ServerOptions, app: express.Express) => Server;
}

interface StartSecretServiceProps {
  app: express.Express;
  environment: SecretServiceEnvironment;
  logger: Logger;
  fileSystem?: FileSystem;
  httpsModule?: HttpsModule;
}

export const createApp = (logger: Logger): express.Express => {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/secret/v1/secrets', createSecretRouter({ logger }));

  return app;
};

export const startSecretService = ({
  app,
  environment,
  logger,
  fileSystem = fs,
  httpsModule = https,
}: StartSecretServiceProps): void => {
  const tlsCertPath = environment.TLS_CERT;
  const tlsKeyPath = environment.TLS_KEY;

  if (fileSystem.existsSync(tlsCertPath) && fileSystem.existsSync(tlsKeyPath)) {
    const tlsOptions = {
      cert: fileSystem.readFileSync(tlsCertPath),
      key: fileSystem.readFileSync(tlsKeyPath),
    };

    const httpsServer = httpsModule.createServer(tlsOptions, app);
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
};
