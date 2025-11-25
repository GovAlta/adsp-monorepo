'use strict';

var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var reviewWorkflows = require('../validation/review-workflows.js');
var workflows = require('../constants/workflows.js');

/**
 *
 * @param { Core.Strapi } strapi - Strapi instance
 * @param userAbility
 * @return { (Stage) => SanitizedStage }
 */ function sanitizeStage({ strapi: strapi1 }, userAbility) {
    const permissionChecker = strapi1.plugin('content-manager').service('permission-checker').create({
        userAbility,
        model: workflows.STAGE_MODEL_UID
    });
    return (entity)=>permissionChecker.sanitizeOutput(entity);
}
var stages = {
    /**
   * List all stages
   * @param {import('koa').BaseContext} ctx - koa context
   */ async find (ctx) {
        const { workflow_id: workflowId } = ctx.params;
        const { populate } = ctx.query;
        const stagesService = index.getService('stages');
        const sanitizer = sanitizeStage({
            strapi
        }, ctx.state.userAbility);
        const stages = await stagesService.find({
            workflowId,
            populate
        });
        ctx.body = {
            data: await utils.async.map(stages, sanitizer)
        };
    },
    /**
   * Get one stage
   * @param {import('koa').BaseContext} ctx - koa context
   */ async findById (ctx) {
        const { id, workflow_id: workflowId } = ctx.params;
        const { populate } = ctx.query;
        const stagesService = index.getService('stages');
        const sanitizer = sanitizeStage({
            strapi
        }, ctx.state.userAbility);
        const stage = await stagesService.findById(id, {
            workflowId,
            populate
        });
        ctx.body = {
            data: await sanitizer(stage)
        };
    },
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
   */ async updateEntity (ctx) {
        const stagesService = index.getService('stages');
        const stagePermissions = index.getService('stage-permissions');
        const workflowService = index.getService('workflows');
        const { model_uid: modelUID, id: documentId } = ctx.params;
        const { body, query = {} } = ctx.request;
        const { sanitizeOutput } = strapi.plugin('content-manager').service('permission-checker').create({
            userAbility: ctx.state.userAbility,
            model: modelUID
        });
        // Load entity
        const locale = await reviewWorkflows.validateLocale(query?.locale);
        const entity = await strapi.documents(modelUID).findOne({
            documentId,
            // @ts-expect-error - locale should be also null in the doc service types
            locale,
            populate: [
                workflows.ENTITY_STAGE_ATTRIBUTE
            ]
        });
        if (!entity) {
            ctx.throw(404, 'Entity not found');
        }
        // Validate if entity stage can be updated
        const canTransition = stagePermissions.can(workflows.STAGE_TRANSITION_UID, entity[workflows.ENTITY_STAGE_ATTRIBUTE]?.id);
        if (!canTransition) {
            ctx.throw(403, 'Forbidden stage transition');
        }
        const { id: stageId } = await reviewWorkflows.validateUpdateStageOnEntity({
            id: Number(body?.data?.id)
        }, 'You should pass an id to the body of the put request.');
        const workflow = await workflowService.assertContentTypeBelongsToWorkflow(modelUID);
        workflowService.assertStageBelongsToWorkflow(stageId, workflow);
        const updatedEntity = await stagesService.updateEntity(entity, modelUID, stageId);
        ctx.body = {
            data: await sanitizeOutput(updatedEntity)
        };
    },
    /**
   * List all the stages that are available for a user to transition an entity to.
   * If the user has permission to change the current stage of the entity every other stage in the workflow is returned
   * @async
   * @param {*} ctx
   * @param {string} ctx.params.model_uid - The model UID of the entity.
   * @param {string} ctx.params.id - The ID of the entity.
   * @throws {ApplicationError} If review workflows is not activated on the specified model UID.
   */ async listAvailableStages (ctx) {
        const stagePermissions = index.getService('stage-permissions');
        const workflowService = index.getService('workflows');
        const { model_uid: modelUID, id: documentId } = ctx.params;
        const { query = {} } = ctx.request;
        if (strapi.plugin('content-manager').service('permission-checker').create({
            userAbility: ctx.state.userAbility,
            model: modelUID
        }).cannot.read()) {
            return ctx.forbidden();
        }
        // Load entity
        const locale = await reviewWorkflows.validateLocale(query?.locale) ?? undefined;
        const entity = await strapi.documents(modelUID).findOne({
            documentId,
            locale,
            populate: [
                workflows.ENTITY_STAGE_ATTRIBUTE
            ]
        });
        if (!entity) {
            ctx.throw(404, 'Entity not found');
        }
        const entityStageId = entity[workflows.ENTITY_STAGE_ATTRIBUTE]?.id;
        const canTransition = stagePermissions.can(workflows.STAGE_TRANSITION_UID, entityStageId);
        const [workflowCount, workflowResult] = await Promise.all([
            workflowService.count(),
            workflowService.getAssignedWorkflow(modelUID, {
                populate: 'stages'
            })
        ]);
        const workflowStages = workflowResult ? workflowResult.stages : [];
        const meta = {
            stageCount: workflowStages.length,
            workflowCount
        };
        if (!canTransition) {
            ctx.body = {
                data: [],
                meta
            };
            return;
        }
        const data = workflowStages.filter((stage)=>stage.id !== entityStageId);
        ctx.body = {
            data,
            meta
        };
    }
};

module.exports = stages;
//# sourceMappingURL=stages.js.map
