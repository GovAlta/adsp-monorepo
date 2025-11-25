import { defaultsDeep, pipe, filter } from 'lodash/fp';
import { getService, getAdminService } from './utils/index.mjs';
import migrateStageAttribute from './migrations/shorten-stage-attribute.mjs';
import migrateReviewWorkflowStagesColor from './migrations/set-stages-default-color.mjs';
import migrateReviewWorkflowStagesRoles from './migrations/set-stages-roles.mjs';
import migrateReviewWorkflowName from './migrations/set-workflow-default-name.mjs';
import migrateWorkflowsContentTypes from './migrations/multiple-workflows.mjs';
import migrateDeletedCTInWorkflows from './migrations/handle-deleted-ct-in-workflows.mjs';
import reviewWorkflowsMiddlewares from './middlewares/review-workflows.mjs';
import { getVisibleContentTypesUID, hasStageAttribute } from './utils/review-workflows.mjs';
import { MAX_WORKFLOWS, MAX_STAGES_PER_WORKFLOW, STAGE_MODEL_UID, ENTITY_STAGE_ATTRIBUTE, ENTITY_ASSIGNEE_ATTRIBUTE } from './constants/workflows.mjs';

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
    const contentTypeToExtend = getVisibleContentTypesUID(strapi.contentTypes);
    for (const contentTypeUID of contentTypeToExtend){
        strapi.get('content-types').extend(contentTypeUID, (contentType)=>{
            // Set Stage attribute
            setRelation(ENTITY_STAGE_ATTRIBUTE, STAGE_MODEL_UID, contentType);
            // Set Assignee attribute
            setRelation(ENTITY_ASSIGNEE_ATTRIBUTE, 'admin::user', contentType);
        });
    }
}
/**
 * Persist the stage & assignee attributes so they are not removed when downgrading to CE.
 *
 * TODO: V6 - Instead of persisting the join tables, always create the stage & assignee attributes, even in CE mode
 *            It was decided in V4 & V5 to not expose them in CE (as they pollute the CTs) but it's not worth given the complexity this needs
 */ function persistRWOnDowngrade({ strapi }) {
    const { removePersistedTablesWithSuffix, persistTables } = getAdminService('persist-tables');
    return async ({ contentTypes })=>{
        const getStageTableToPersist = (contentTypeUID)=>{
            // Persist the stage join table
            const { attributes, tableName } = strapi.db.metadata.get(contentTypeUID);
            const joinTableName = attributes[ENTITY_STAGE_ATTRIBUTE].joinTable.name;
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
            const joinTableName = attributes[ENTITY_ASSIGNEE_ATTRIBUTE].joinTable.name;
            return {
                name: joinTableName,
                dependsOn: [
                    {
                        name: tableName
                    }
                ]
            };
        };
        const enabledRWContentTypes = pipe([
            getVisibleContentTypesUID,
            filter((uid)=>hasStageAttribute(contentTypes[uid]))
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
    strapi.hook('strapi::content-types.beforeSync').register(migrateStageAttribute);
    strapi.hook('strapi::content-types.afterSync').register(persistRWOnDowngrade({
        strapi
    }));
    strapi.hook('strapi::content-types.afterSync').register(migrateReviewWorkflowStagesColor).register(migrateReviewWorkflowStagesRoles).register(migrateReviewWorkflowName).register(migrateWorkflowsContentTypes).register(migrateDeletedCTInWorkflows);
    // Middlewares
    reviewWorkflowsMiddlewares.contentTypeMiddleware(strapi);
    // Schema customization
    extendReviewWorkflowContentTypes({
        strapi
    });
    // License limits
    const reviewWorkflowsOptions = defaultsDeep({
        numberOfWorkflows: MAX_WORKFLOWS,
        stagesPerWorkflow: MAX_STAGES_PER_WORKFLOW
    }, strapi.ee.features.get('review-workflows'));
    const workflowsValidationService = getService('validation', {
        strapi
    });
    workflowsValidationService.register(reviewWorkflowsOptions);
});

export { register as default };
//# sourceMappingURL=register.mjs.map
