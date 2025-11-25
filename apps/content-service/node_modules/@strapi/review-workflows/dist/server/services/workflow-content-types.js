'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var index = require('../utils/index.js');
var workflows = require('../constants/workflows.js');

var workflowsContentTypesFactory = (({ strapi })=>{
    const contentManagerContentTypeService = strapi.plugin('content-manager').service('content-types');
    const stagesService = index.getService('stages', {
        strapi
    });
    const updateContentTypeConfig = async (uid, reviewWorkflowOption)=>{
        // Merge options in the configuration as the configuration service use a destructuration merge which doesn't include nested objects
        const modelConfig = await contentManagerContentTypeService.findConfiguration(uid);
        await contentManagerContentTypeService.updateConfiguration({
            uid
        }, {
            options: fp.merge(modelConfig.options, {
                reviewWorkflows: reviewWorkflowOption
            })
        });
    };
    return {
        /**
     * Migrates entities stages. Used when a content type is assigned to a workflow.
     * @param {*} options
     * @param {Array<string>} options.srcContentTypes - The content types assigned to the previous workflow
     * @param {Array<string>} options.destContentTypes - The content types assigned to the new workflow
     * @param {Workflow.Stage} options.stageId - The new stage to assign the entities to
     */ async migrate ({ srcContentTypes = [], destContentTypes, stageId }) {
            const workflowsService = index.getService('workflows', {
                strapi
            });
            const { created, deleted } = diffContentTypes(srcContentTypes, destContentTypes);
            await utils.async.map(created, async (uid)=>{
                // Content Types should only be assigned to one workflow
                // However, edge cases can happen, and this handles them
                const srcWorkflows = await workflowsService._getAssignedWorkflows(uid, {});
                if (srcWorkflows.length) {
                    // Updates all existing entities stages links to the new stage
                    await stagesService.updateEntitiesStage(uid, {
                        toStageId: stageId
                    });
                    // Transfer content types from the previous workflow(s)
                    await utils.async.map(srcWorkflows, (srcWorkflow)=>this.transferContentTypes(srcWorkflow, uid));
                }
                await updateContentTypeConfig(uid, true);
                // Create new stages links to the new stage
                return stagesService.updateEntitiesStage(uid, {
                    fromStageId: null,
                    toStageId: stageId
                });
            }, // transferContentTypes can cause race conditions if called in parallel when updating the same workflow
            {
                concurrency: 1
            });
            await utils.async.map(deleted, async (uid)=>{
                await updateContentTypeConfig(uid, false);
                await stagesService.deleteAllEntitiesStage(uid, {});
            });
        },
        /**
     * Filters the content types assigned to a workflow
     * @param {Workflow} srcWorkflow - The workflow to transfer from
     * @param {string} uid - The content type uid
     */ async transferContentTypes (srcWorkflow, uid) {
            // Update assignedContentTypes of the previous workflow
            await strapi.db.query(workflows.WORKFLOW_MODEL_UID).update({
                where: {
                    id: srcWorkflow.id
                },
                data: {
                    contentTypes: srcWorkflow.contentTypes.filter((contentType)=>contentType !== uid)
                }
            });
        }
    };
});
const diffContentTypes = (srcContentTypes, destContentTypes)=>{
    const created = fp.difference(destContentTypes, srcContentTypes);
    const deleted = fp.difference(srcContentTypes, destContentTypes);
    return {
        created,
        deleted
    };
};

module.exports = workflowsContentTypesFactory;
//# sourceMappingURL=workflow-content-types.js.map
