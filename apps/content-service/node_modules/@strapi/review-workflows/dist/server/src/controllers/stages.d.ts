import type { Context } from 'koa';
declare const _default: {
    /**
     * List all stages
     * @param {import('koa').BaseContext} ctx - koa context
     */
    find(ctx: Context): Promise<void>;
    /**
     * Get one stage
     * @param {import('koa').BaseContext} ctx - koa context
     */
    findById(ctx: Context): Promise<void>;
    /**
     * Updates an entity's stage.
     * @async
     * @param {Object} ctx - The Koa context object.
     * @param {Object} ctx.params - An object containing the parameters from the request URL.
     * @param {string} ctx.params.model_uid - The model UID of the entity.
     * @param {string} ctx.params.id - The ID of the entity to update.
     * @param {Object} ctx.request.body.data - Optional data object containing the new stage ID for the entity.
     * @param {string} ctx.request.body.data.id - The ID of the new stage for the entity.
     * @throws {ApplicationError} If review workflows is not activated on the specified model UID.
     * @throws {ValidationError} If the `data` object in the request body fails to pass validation.
     * @returns {Promise<void>} A promise that resolves when the entity's stage has been updated.
     */
    updateEntity(ctx: Context): Promise<void>;
    /**
     * List all the stages that are available for a user to transition an entity to.
     * If the user has permission to change the current stage of the entity every other stage in the workflow is returned
     * @async
     * @param {*} ctx
     * @param {string} ctx.params.model_uid - The model UID of the entity.
     * @param {string} ctx.params.id - The ID of the entity.
     * @throws {ApplicationError} If review workflows is not activated on the specified model UID.
     */
    listAvailableStages(ctx: Context): Promise<Context | undefined>;
};
export default _default;
//# sourceMappingURL=stages.d.ts.map