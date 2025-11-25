import { KoaHelmet } from 'koa-helmet';
import type { Core } from '@strapi/types';
export type Config = NonNullable<Parameters<KoaHelmet>[0]>;
export declare const security: Core.MiddlewareFactory<Config>;
//# sourceMappingURL=security.d.ts.map