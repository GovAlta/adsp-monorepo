import * as qs from 'qs';
import type { Core } from '@strapi/types';
import Strapi, { type StrapiOptions } from './Strapi';
export { default as compileStrapi } from './compile';
export * as factories from './factories';
export declare const createStrapi: (options?: Partial<StrapiOptions>) => Core.Strapi;
declare module 'koa' {
    type ParsedQuery = ReturnType<typeof qs.parse>;
    interface BaseRequest {
        _querycache?: ParsedQuery;
        get query(): ParsedQuery;
        set query(obj: any);
    }
    interface BaseContext {
        _querycache?: ParsedQuery;
        get query(): ParsedQuery;
        set query(obj: any);
    }
}
//# sourceMappingURL=index.d.ts.map