import type { Context } from 'koa';
declare const _default: {
    /**
     * Create a new role
     * @param {KoaContext} ctx - koa context
     */
    create(ctx: Context): Promise<void>;
    /**
     * Returns on role by id
     * @param {KoaContext} ctx - koa context
     */
    findOne(ctx: Context): Promise<Context | undefined>;
    /**
     * Returns every roles
     * @param {KoaContext} ctx - koa context
     */
    findAll(ctx: Context): Promise<void>;
    /**
     * Updates a role by id
     * @param {KoaContext} ctx - koa context
     */
    update(ctx: Context): Promise<Context | undefined>;
    /**
     * Returns the permissions assigned to a role
     * @param {KoaContext} ctx - koa context
     */
    getPermissions(ctx: Context): Promise<Context | undefined>;
    /**
     * Updates the permissions assigned to a role
     * @param {KoaContext} ctx - koa context
     */
    updatePermissions(ctx: Context): Promise<Context | undefined>;
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