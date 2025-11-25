import type { Context } from 'koa';
import '@strapi/types';
declare const _default: {
    login: import("koa").Middleware<import("koa").DefaultState, Context, any>;
    registrationInfo(ctx: Context): Promise<void>;
    register(ctx: Context): Promise<Context | undefined>;
    registerAdmin(ctx: Context): Promise<Context | undefined>;
    forgotPassword(ctx: Context): Promise<void>;
    resetPassword(ctx: Context): Promise<Context | undefined>;
    accessToken(ctx: Context): Promise<Context | undefined>;
    logout(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=authentication.d.ts.map