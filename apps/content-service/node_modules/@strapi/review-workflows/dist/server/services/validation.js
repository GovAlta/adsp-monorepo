'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var workflows = require('../constants/workflows.js');
var reviewWorkflows = require('../utils/review-workflows.js');

const { ValidationError } = utils.errors;
var reviewWorkflowsValidation = (({ strapi })=>{
    return {
        limits: {
            numberOfWorkflows: workflows.MAX_WORKFLOWS,
            stagesPerWorkflow: workflows.MAX_STAGES_PER_WORKFLOW
        },
        register ({ numberOfWorkflows, stagesPerWorkflow }) {
            if (!Object.isFrozen(this.limits)) {
                this.limits.numberOfWorkflows = reviewWorkflows.clampMaxWorkflows(numberOfWorkflows || this.limits.numberOfWorkflows);
                this.limits.stagesPerWorkflow = reviewWorkflows.clampMaxStagesPerWorkflow(stagesPerWorkflow || this.limits.stagesPerWorkflow);
                Object.freeze(this.limits);
            }
        },
        /**
     * Validates the stages of a workflow.
     * @param {Array} stages - Array of stages to be validated.
     * @throws {ValidationError} - If the workflow has no stages or exceeds the limit.
     */ validateWorkflowStages (stages) {
            if (!stages || stages.length === 0) {
                throw new ValidationError(workflows.ERRORS.WORKFLOW_WITHOUT_STAGES);
            }
            if (stages.length > this.limits.stagesPerWorkflow) {
                throw new ValidationError(workflows.ERRORS.STAGES_LIMIT);
            }
            // Validate stage names are not duplicated
            const stageNames = stages.map((stage)=>stage.name);
            if (fp.uniq(stageNames).length !== stageNames.length) {
                throw new ValidationError(workflows.ERRORS.DUPLICATED_STAGE_NAME);
            }
        },
        async validateWorkflowCountStages (workflowId, countAddedStages = 0) {
            const stagesService = index.getService('stages', {
                strapi
            });
            const countWorkflowStages = await stagesService.count({
                workflowId
            });
            if (countWorkflowStages + countAddedStages > this.limits.stagesPerWorkflow) {
                throw new ValidationError(workflows.ERRORS.STAGES_LIMIT);
            }
        },
        /**
     * Validates the count of existing and added workflows.
     * @param {number} [countAddedWorkflows=0] - The count of workflows to be added.
     * @throws {ValidationError} - If the total count of workflows exceeds the limit.
     * @returns {Promise<void>} - A Promise that resolves when the validation is completed.
     */ async validateWorkflowCount (countAddedWorkflows = 0) {
            const workflowsService = index.getService('workflows', {
                strapi
            });
            const countWorkflows = await workflowsService.count();
            if (countWorkflows + countAddedWorkflows > this.limits.numberOfWorkflows) {
                throw new ValidationError(workflows.ERRORS.WORKFLOWS_LIMIT);
            }
        }
    };
});

module.exports = reviewWorkflowsValidation;
//# sourceMappingURL=validation.js.map
