import type Koa from 'koa';
/**
 * Email.js controller
 *
 * @description: A set of functions called "actions" of the `email` plugin.
 */
declare const emailController: {
    send(ctx: Koa.Context): Promise<void>;
    test(ctx: Koa.Context): Promise<void>;
    getSettings(ctx: Koa.Context): Promise<void>;
};
export default emailController;
//# sourceMappingURL=email.d.ts.map