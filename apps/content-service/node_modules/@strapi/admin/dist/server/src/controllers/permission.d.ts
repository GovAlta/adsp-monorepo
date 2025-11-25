import type { Context } from 'koa';
declare const _default: {
    /**
     * Check each permissions from `request.body.permissions` and returns an array of booleans
     * @param {KoaContext} ctx - koa context
     */
    check(ctx: Context): Promise<void>;
    /**
     * Returns every permissions, in nested format
     * @param {KoaContext} ctx - koa context
     */
    getAll(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=permission.d.ts.map