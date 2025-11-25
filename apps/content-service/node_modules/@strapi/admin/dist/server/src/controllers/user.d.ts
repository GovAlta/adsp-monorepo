import type { Context } from 'koa';
declare const _default: {
    create(ctx: Context): Promise<void>;
    find(ctx: Context): Promise<void>;
    findOne(ctx: Context): Promise<Context | undefined>;
    update(ctx: Context): Promise<Context | undefined>;
    deleteOne(ctx: Context): Promise<any>;
    /**
     * Delete several users
     * @param ctx - koa context
     */
    deleteMany(ctx: Context): Promise<any>;
};
export default _default;
//# sourceMappingURL=user.d.ts.map