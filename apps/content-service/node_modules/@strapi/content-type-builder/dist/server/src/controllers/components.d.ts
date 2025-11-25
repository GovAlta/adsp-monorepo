import type { Context } from 'koa';
/**
 * Components controller
 */
declare const _default: {
    /**
     * GET /components handler
     * Returns a list of available components
     * @param {Object} ctx - koa context
     */
    getComponents(ctx: Context): Promise<void>;
    /**
     * GET /components/:uid
     * Returns a specific component
     * @param {Object} ctx - koa context
     */
    getComponent(ctx: Context): Promise<any>;
    /**
     * POST /components
     * Creates a component and returns its infos
     * @param {Object} ctx - koa context
     */
    createComponent(ctx: Context): Promise<any>;
    /**
     * PUT /components/:uid
     * Updates a component and return its infos
     * @param {Object} ctx - koa context - enhanced koa context
     */
    updateComponent(ctx: Context): Promise<any>;
    /**
     * DELETE /components/:uid
     * Deletes a components and returns its old infos
     * @param {Object} ctx - koa context
     */
    deleteComponent(ctx: Context): Promise<any>;
};
export default _default;
//# sourceMappingURL=components.d.ts.map