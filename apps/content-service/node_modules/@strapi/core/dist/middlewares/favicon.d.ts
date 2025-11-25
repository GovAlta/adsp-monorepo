/// <reference path="../../src/modules.d.ts" />
import koaFavicon from 'koa-favicon';
import type { Core } from '@strapi/types';
export type Config = NonNullable<Parameters<typeof koaFavicon>[1]>;
export declare const favicon: Core.MiddlewareFactory<Config>;
//# sourceMappingURL=favicon.d.ts.map