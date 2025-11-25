import type { Context } from 'koa';
import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    find(ctx: Context): Promise<void>;
    findOne(ctx: Context): Promise<Context | undefined>;
    destroy(ctx: Context): Promise<Context | undefined>;
    updateFileInfo(ctx: Context): Promise<void>;
    replaceFile(ctx: Context): Promise<void>;
    uploadFiles(ctx: Context): Promise<void>;
    upload(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=content-api.d.ts.map