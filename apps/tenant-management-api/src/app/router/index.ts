import { Router } from 'express';

import directoryRouter from './directory';
import fileRouter from './file';
import realmRouter from './realm';
import { tenantPublicRouter, tenantRouter } from './tenant';

export const apiRouter = Router();
export const apiPublicRouter = Router();

apiRouter.use('/discovery/v1', directoryRouter);
apiRouter.use('/realm', realmRouter);
apiRouter.use('/file/v1', fileRouter);
apiRouter.use('/tenant/v1', tenantRouter);

apiPublicRouter.use('/tenant/v1', tenantPublicRouter);
