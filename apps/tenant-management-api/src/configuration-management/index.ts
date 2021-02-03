import * as express from 'express';

import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyConfigMiddleware } from './configuration';
import { createRepositories } from './mongo';

export const createConfigService = ({
})=> {
const logger = createLogger(
  'configuration-management-service',
  environment.LOG_LEVEL || 'info'
);

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

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

const port = process.env.port || 3340;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
}

