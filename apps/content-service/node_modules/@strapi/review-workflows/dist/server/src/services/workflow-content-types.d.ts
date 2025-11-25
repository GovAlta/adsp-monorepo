import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    /**
     * Migrates entities stages. Used when a content type is assigned to a workflow.
     * @param {*} options
     * @param {Array<string>} options.srcContentTypes - The content types assigned to the previous workflow
     * @param {Array<string>} options.destContentTypes - The content types assigned to the new workflow
     * @param {Workflow.Stage} options.stageId - The new stage to assign the entities to
     */
    migrate({ srcContentTypes, destContentTypes, stageId }: any): Promise<void>;
    /**
     * Filters the content types assigned to a workflow
     * @param {Workflow} srcWorkflow - The workflow to transfer from
     * @param {string} uid - The content type uid
     */
    transferContentTypes(srcWorkflow: any, uid: any): Promise<void>;
};
export default _default;
//# sourceMappingURL=workflow-content-types.d.ts.map