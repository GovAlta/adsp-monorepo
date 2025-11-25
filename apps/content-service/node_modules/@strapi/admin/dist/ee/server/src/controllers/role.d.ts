import type { Context } from 'koa';
declare const _default: {
    /**
     * Create a new role
     * @param {KoaContext} ctx - koa context
     */
    create(ctx: Context): Promise<void>;
    /**
     * Delete a role
     * @param {KoaContext} ctx - koa context
     */
    deleteOne(ctx: Context): Promise<any>;
    /**
     * delete several roles
     * @param {KoaContext} ctx - koa context
     */
    deleteMany(ctx: Context): Promise<any>;
};
export default _default;
//# sourceMappingURL=role.d.ts.map