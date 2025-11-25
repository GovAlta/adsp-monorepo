import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    /**
     * Returns all the workflows matching the user-defined filters.
     * @param {object} opts - Options for the query.
     * @param {object} opts.filters - Filters object.
     * @returns {Promise<object[]>} - List of workflows that match the user's filters.
     */
    find(opts?: any): Promise<any[]>;
    /**
     * Returns the workflow with the specified ID.
     * @param {string} id - ID of the requested workflow.
     * @param {object} opts - Options for the query.
     * @returns {Promise<object>} - Workflow object matching the requested ID.
     */
    findById(id: any, opts?: {
        populate?: any;
    }): Promise<any>;
    /**
     * Creates a new workflow.
     * @param {object} opts - Options for creating the new workflow.
     * @returns {Promise<object>} - Workflow object that was just created.
     * @throws {ValidationError} - If the workflow has no stages.
     */
    create(opts: {
        data: any;
    }): Promise<any>;
    /**
     * Updates an existing workflow.
     * @param {object} workflow - The existing workflow to update.
     * @param {object} opts - Options for updating the workflow.
     * @returns {Promise<object>} - Workflow object that was just updated.
     * @throws {ApplicationError} - If the supplied stage ID does not belong to the workflow.
     */
    update(workflow: any, opts: any): Promise<any>;
    /**
     * Deletes an existing workflow.
     * Also deletes all the workflow stages and migrate all assigned the content types.
     * @param {*} workflow
     * @param {*} opts
     * @returns
     */
    delete(workflow: any, opts: any): Promise<any>;
    /**
     * Returns the total count of workflows.
     * @returns {Promise<number>} - Total count of workflows.
     */
    count(): Promise<number>;
    /**
     * Finds the assigned workflow for a given content type ID.
     * @param {string} uid - Content type ID to find the assigned workflow for.
     * @param {object} opts - Options for the query.
     * @returns {Promise<object|null>} - Assigned workflow object if found, or null.
     */
    getAssignedWorkflow(uid: any, opts?: any): Promise<any>;
    /**
     * Finds all the assigned workflows for a given content type ID.
     * Normally, there should only be one workflow assigned to a content type.
     * However, edge cases can occur where a content type is assigned to multiple workflows.
     * @param {string} uid - Content type ID to find the assigned workflows for.
     * @param {object} opts - Options for the query.
     * @returns {Promise<object[]>} - List of assigned workflow objects.
     */
    _getAssignedWorkflows(uid: any, opts?: {}): Promise<any[]>;
    /**
     * Asserts that a content type has an assigned workflow.
     * @param {string} uid - Content type ID to verify the assignment of.
     * @returns {Promise<object>} - Workflow object associated with the content type ID.
     * @throws {ApplicationError} - If no assigned workflow is found for the content type ID.
     */
    assertContentTypeBelongsToWorkflow(uid: any): Promise<any>;
    /**
     * Asserts that a stage belongs to a given workflow.
     * @param {string} stageId - ID of stage to check.
     * @param {object} workflow - Workflow object to check against.
     * @returns
     * @throws {ApplicationError} - If the stage does not belong to the specified workflow.
     */
    assertStageBelongsToWorkflow(stageId: any, workflow: any): void;
};
export default _default;
//# sourceMappingURL=workflows.d.ts.map