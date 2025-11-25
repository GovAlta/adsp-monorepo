import type { Context } from 'koa';
declare const _default: {
    /**
     * Updates an entity's assignee.
     * @async
     * @param {Object} ctx - The Koa context object.
     * @param {Object} ctx.params - An object containing the parameters from the request URL.
     * @param {string} ctx.params.model_uid - The model UID of the entity.
     * @param {string} ctx.params.id - The ID of the entity to update.
     * @param {Object} ctx.request.body.data - Optional data object containing the new assignee ID for the entity.
     * @param {string} ctx.request.body.data.id - The ID of the new assignee for the entity.
     * @throws {ApplicationError} If review workflows is not activated on the specified model UID.
     * @throws {ValidationError} If the `data` object in the request body fails to pass validation.
     * @returns {Promise<void>} A promise that resolves when the entity's assignee has been updated.
     */
    updateEntity(ctx: Context): Promise<void>;
};
export default _default;
//# sourceMappingURL=assignees.d.ts.map