import { Router } from 'express';
import * as passport from 'passport';
import directoryRouter from './directory';
import { tenantRouter } from './tenant';

export const apiRouter = Router();

const passportMiddleware = passport.authenticate(['jwt'], { session: false });

apiRouter.use('/discovery/v1', [passportMiddleware, directoryRouter]);
apiRouter.use('/tenant/v1', [passportMiddleware, tenantRouter]);
