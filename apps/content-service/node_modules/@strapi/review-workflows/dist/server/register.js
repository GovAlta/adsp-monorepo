'use strict';

var fp = require('lodash/fp');
var index = require('./utils/index.js');
var shortenStageAttribute = require('./migrations/shorten-stage-attribute.js');
var setStagesDefaultColor = require('./migrations/set-stages-default-color.js');
var setStagesRoles = require('./migrations/set-stages-roles.js');
var setWorkflowDefaultName = require('./migrations/set-workflow-default-name.js');
var multipleWorkflows = require('./migrations/multiple-workflows.js');
var handleDeletedCtInWorkflows = require('./migrations/handle-deleted-ct-in-workflows.js');
var reviewWorkflows = require('./middlewares/review-workflows.js');
var reviewWorkflows$1 = require('./utils/review-workflows.js');
var workflows = require('./constants/workflows.js');

const setRelation = (attributeName, target, contentType)=>{
    Object.assign(contentType.attributes, {
        [attributeName]: {
            writable: true,
            private: false,
            configurable: false,
            visible: false,
            useJoinTable: true,
            type: 'relation',
            relation: 'oneToOne',
            target
        }
    });
    return contentType;
};
/**
 * Add the stage and assignee attributes to content types
 */ function extendReviewWorkflowContentTypes({ strapi }) {
    const contentTypeToExtend = reviewWorkflows$1.getVisibleContentTypesUID(strapi.contentTypes);
    for (const contentTypeUID of contentTypeToExtend){
        strapi.get('content-types').extend(contentTypeUID, (contentType)=>{
            // Set Stage attribute
            setRelation(workflows.ENTITY_STAGE_ATTRIBUTE, workflows.STAGE_MODEL_UID, contentType);
            // Set Assignee attribute
            setRelation(workflows.ENTITY_ASSIGNEE_ATTRIBUTE, 'admin::user', contentType);
        });
    }
}
/**
 * Persist the stage & assignee attributes so they are not removed when downgrading to CE.
 *
 * TODO: V6 - Instead of persisting the join tables, always create the stage & assignee attributes, even in CE mode
 *            It was decided in V4 & V5 to not expose them in CE (as they pollute the CTs) but it's not worth given the complexity this needs
 */ function persistRWOnDowngrade({ strapi }) {
    const { removePersistedTablesWithSuffix, persistTables } = index.getAdminService('persist-tables');
    return async ({ contentTypes })=>{
        const getStageTableToPersist = (contentTypeUID)=>{
            // Persist the stage join table
            const { attributes, tableName } = strapi.db.metadata.get(contentTypeUID);
            const joinTableName = attributes[workflows.ENTITY_STAGE_ATTRIBUTE].joinTable.name;
            return {
                name: joinTableName,
                dependsOn: [
                    {
                        name: tableName
                    }
                ]
            };
        };
        const getAssigneeTableToPersist = (contentTypeUID)=>{
            // Persist the assignee join table
            const { attributes, tableName } = strapi.db.metadata.get(contentTypeUID);
            const joinTableName = attributes[workflows.ENTITY_ASSIGNEE_ATTRIBUTE].joinTable.name;
            return {
                name: joinTableName,
                dependsOn: [
                    {
                        name: tableName
                    }
                ]
            };
        };
        const enabledRWContentTypes = fp.pipe([
            reviewWorkflows$1.getVisibleContentTypesUID,
            fp.filter((uid)=>reviewWorkflows$1.hasStageAttribute(contentTypes[uid]))
        ])(contentTypes);
        // Remove previously created join tables and persist the new ones
        const stageJoinTablesToPersist = enabledRWContentTypes.map(getStageTableToPersist);
        await removePersistedTablesWithSuffix('_strapi_stage_lnk');
        await persistTables(stageJoinTablesToPersist);
        // Remove previously created join tables and persist the new ones
        const assigneeJoinTablesToPersist = enabledRWContentTypes.map(getAssigneeTableToPersist);
        await removePersistedTablesWithSuffix('_strapi_assignee_lnk');
        await persistTables(assigneeJoinTablesToPersist);
    };
}
var register = (async ({ strapi })=>{
    // Data Migrations
    strapi.hook('strapi::content-types.beforeSync').register(shortenStageAttribute);
    strapi.hook('strapi::content-types.afterSync').register(persistRWOnDowngrade({
        strapi
    }));
    strapi.hook('strapi::content-types.afterSync').register(setStagesDefaultColor).register(setStagesRoles).register(setWorkflowDefaultName).register(multipleWorkflows).register(handleDeletedCtInWorkflows);
    // Middlewares
    reviewWorkflows.default.contentTypeMiddleware(strapi);
    // Schema customization
    extendReviewWorkflowContentTypes({
        strapi
    });
    // License limits
    const reviewWorkflowsOptions = fp.defaultsDeep({
        numberOfWorkflows: workflows.MAX_WORKFLOWS,
        stagesPerWorkflow: workflows.MAX_STAGES_PER_WORKFLOW
    }, strapi.ee.features.get('review-workflows'));
    const workflowsValidationService = index.getService('validation', {
        strapi
    });
    workflowsValidationService.register(reviewWorkflowsOptions);
});

module.exports = register;
//# sourceMappingURL=register.js.map
