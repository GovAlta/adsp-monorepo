import type { Core } from '@strapi/types';
export interface Config {
    handlers?: Record<number, Core.MiddlewareHandler>;
}
export declare const responses: Core.MiddlewareFactory<Config>;
//# sourceMappingURL=responses.d.ts.map