/// <reference types="koa" />
export { default as rateLimit } from './rateLimit';
export { default as dataTransfer } from './data-transfer';
declare const _default: {
    rateLimit: (config: any, { strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => (ctx: import("koa").Context, next: import("koa").Next) => Promise<any>;
    'data-transfer': () => (ctx: import("koa").Context, next: import("koa").Next) => Promise<any>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map