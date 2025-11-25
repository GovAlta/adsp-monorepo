import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    limits: {
        numberOfWorkflows: number;
        stagesPerWorkflow: number;
    };
    register({ numberOfWorkflows, stagesPerWorkflow }: any): void;
    /**
     * Validates the stages of a workflow.
     * @param {Array} stages - Array of stages to be validated.
     * @throws {ValidationError} - If the workflow has no stages or exceeds the limit.
     */
    validateWorkflowStages(stages: any): void;
    validateWorkflowCountStages(workflowId: any, countAddedStages?: number): Promise<void>;
    /**
     * Validates the count of existing and added workflows.
     * @param {number} [countAddedWorkflows=0] - The count of workflows to be added.
     * @throws {ValidationError} - If the total count of workflows exceeds the limit.
     * @returns {Promise<void>} - A Promise that resolves when the validation is completed.
     */
    validateWorkflowCount(countAddedWorkflows?: number): Promise<void>;
};
export default _default;
//# sourceMappingURL=validation.d.ts.map