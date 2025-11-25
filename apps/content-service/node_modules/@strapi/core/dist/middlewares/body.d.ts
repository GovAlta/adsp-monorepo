import { KoaBodyMiddlewareOptions } from 'koa-body';
import type { Core } from '@strapi/types';
export type Config = KoaBodyMiddlewareOptions;
declare const bodyMiddleware: Core.MiddlewareFactory<Config>;
export { bodyMiddleware as body };
//# sourceMappingURL=body.d.ts.map