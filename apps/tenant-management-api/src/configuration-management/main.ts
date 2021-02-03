import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyConfigMiddleware } from './configuration';
import { createRepositories } from './mongo';

const logger = createLogger(
  'configuration-management-service', 
  environment.LOG_LEVEL || 'info'
);

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use('/configuration');

Promise.all([
createRepositories({...environment, logger})
]).then(([repositories]) => {
  app.get(
    '/health', 
    (req, res) => res.json({
      db: repositories.isConnected(),
    })
  );
  
  applyConfigMiddleware(
    app, 
    { 
      ...repositories,
      logger,  
    }
  );
}
);
    
const port = environment.PORT || 3335;
  
const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', 
    (err) => logger.error(`Error encountered in server: ${err}`));

