export declare const WORKFLOW_MODEL_UID = "plugin::review-workflows.workflow";
export declare const STAGE_MODEL_UID = "plugin::review-workflows.workflow-stage";
/**
 * TODO: For V4 compatibility, the old UID was kept, when review workflows was in the admin package
 *
 * NOTE!: if you change this string you need to change it here too: strapi/packages/core/review-workflows/admin/src/routes/settings/components/Stages.tsx
 */
export declare const STAGE_TRANSITION_UID = "admin::review-workflows.stage.transition";
export declare const STAGE_DEFAULT_COLOR = "#4945FF";
export declare const ENTITY_STAGE_ATTRIBUTE = "strapi_stage";
export declare const ENTITY_ASSIGNEE_ATTRIBUTE = "strapi_assignee";
export declare const MAX_WORKFLOWS = 200;
export declare const MAX_STAGES_PER_WORKFLOW = 200;
export declare const ERRORS: {
    WORKFLOW_WITHOUT_STAGES: string;
    WORKFLOWS_LIMIT: string;
    STAGES_LIMIT: string;
    DUPLICATED_STAGE_NAME: string;
};
export declare const WORKFLOW_POPULATE: {
    stages: {
        populate: {
            permissions: {
                fields: string[];
                populate: {
                    role: {
                        fields: string[];
                    };
                };
            };
        };
    };
    stageRequiredToPublish: boolean;
};
//# sourceMappingURL=workflows.d.ts.map