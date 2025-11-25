import type { Context } from 'koa';
declare const _default: {
    /**
     * Create a new workflow
     * @param {import('koa').BaseContext} ctx - koa context
     */
    create(ctx: Context): Promise<void>;
    /**
     * Update a workflow
     * @param {import('koa').BaseContext} ctx - koa context
     */
    update(ctx: Context): Promise<Context | undefined>;
    /**
     * Delete a workflow
     * @param {import('koa').BaseContext} ctx - koa context
     */
    delete(ctx: Context): Promise<Context | undefined>;
    /**
     * List all workflows
     * @param {import('koa').BaseContext} ctx - koa context
     */
    find(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=workflows.d.ts.map