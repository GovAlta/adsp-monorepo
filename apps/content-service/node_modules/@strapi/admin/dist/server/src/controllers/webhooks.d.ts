import type { Context } from 'koa';
declare const _default: {
    listWebhooks(ctx: Context): Promise<void>;
    getWebhook(ctx: Context): Promise<Context | undefined>;
    createWebhook(ctx: Context): Promise<void>;
    updateWebhook(ctx: Context): Promise<Context | undefined>;
    deleteWebhook(ctx: Context): Promise<Context | undefined>;
    deleteWebhooks(ctx: Context): Promise<Context | undefined>;
    triggerWebhook(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=webhooks.d.ts.map