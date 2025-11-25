const WORKFLOW_MODEL_UID = 'plugin::review-workflows.workflow';
const STAGE_MODEL_UID = 'plugin::review-workflows.workflow-stage';
/**
 * TODO: For V4 compatibility, the old UID was kept, when review workflows was in the admin package
 *
 * NOTE!: if you change this string you need to change it here too: strapi/packages/core/review-workflows/admin/src/routes/settings/components/Stages.tsx
 */ const STAGE_TRANSITION_UID = 'admin::review-workflows.stage.transition';
const STAGE_DEFAULT_COLOR = '#4945FF';
const ENTITY_STAGE_ATTRIBUTE = 'strapi_stage';
const ENTITY_ASSIGNEE_ATTRIBUTE = 'strapi_assignee';
const MAX_WORKFLOWS = 200;
const MAX_STAGES_PER_WORKFLOW = 200;
const ERRORS = {
    WORKFLOW_WITHOUT_STAGES: 'A workflow must have at least one stage.',
    WORKFLOWS_LIMIT: 'You’ve reached the limit of workflows in your plan. Delete a workflow or contact Sales to enable more workflows.',
    STAGES_LIMIT: 'You’ve reached the limit of stages for this workflow in your plan. Try deleting some stages or contact Sales to enable more stages.',
    DUPLICATED_STAGE_NAME: 'Stage names must be unique.'
};
const WORKFLOW_POPULATE = {
    stages: {
        populate: {
            permissions: {
                fields: [
                    'action',
                    'actionParameters'
                ],
                populate: {
                    role: {
                        fields: [
                            'id',
                            'name'
                        ]
                    }
                }
            }
        }
    },
    stageRequiredToPublish: true
};

export { ENTITY_ASSIGNEE_ATTRIBUTE, ENTITY_STAGE_ATTRIBUTE, ERRORS, MAX_STAGES_PER_WORKFLOW, MAX_WORKFLOWS, STAGE_DEFAULT_COLOR, STAGE_MODEL_UID, STAGE_TRANSITION_UID, WORKFLOW_MODEL_UID, WORKFLOW_POPULATE };
//# sourceMappingURL=workflows.mjs.map
