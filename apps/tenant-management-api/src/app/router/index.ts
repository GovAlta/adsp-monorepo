import { Router } from 'express';

import directoryRouter from './directory';
import fileRouter from './file';
import realmRouter from './realm';

const apiRouter = Router();

apiRouter.use('/discovery/v1', directoryRouter);
apiRouter.use('/realm', realmRouter);
apiRouter.use('/tenant/file', fileRouter);

export default apiRouter;
