import type { Core } from '@strapi/types';
import type { Sender } from './sender';
declare const createMiddleware: ({ sendEvent, strapi }: {
    sendEvent: Sender;
    strapi: Core.Strapi;
}) => Core.MiddlewareHandler;
export default createMiddleware;
//# sourceMappingURL=middleware.d.ts.map