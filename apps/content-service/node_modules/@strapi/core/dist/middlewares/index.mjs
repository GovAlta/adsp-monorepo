import { compression } from './compression.mjs';
import { cors } from './cors.mjs';
import { errors as errorMiddleware } from './errors.mjs';
import { favicon } from './favicon.mjs';
import { ip } from './ip.mjs';
import { logger } from './logger.mjs';
import { poweredBy } from './powered-by.mjs';
import { body as bodyMiddleware } from './body.mjs';
import { query } from './query.mjs';
import { responseTime } from './response-time.mjs';
import { responses } from './responses.mjs';
import { security } from './security.mjs';
import { session } from './session.mjs';
import { publicStatic } from './public.mjs';

const middlewares = {
    compression,
    cors,
    errors: errorMiddleware,
    favicon,
    ip,
    logger,
    poweredBy,
    body: bodyMiddleware,
    query,
    responseTime,
    responses,
    security,
    session,
    public: publicStatic
};

export { middlewares };
//# sourceMappingURL=index.mjs.map
