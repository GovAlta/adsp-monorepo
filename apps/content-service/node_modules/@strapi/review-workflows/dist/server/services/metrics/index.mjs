import '@strapi/types';

const sendDidCreateStage = async ()=>{
    strapi.telemetry.send('didCreateStage', {});
};
const sendDidEditStage = async ()=>{
    strapi.telemetry.send('didEditStage', {});
};
const sendDidDeleteStage = async ()=>{
    strapi.telemetry.send('didDeleteStage', {});
};
const sendDidChangeEntryStage = async ()=>{
    strapi.telemetry.send('didChangeEntryStage', {});
};
const sendDidCreateWorkflow = async (workflowId, hasRequiredStageToPublish)=>{
    strapi.telemetry.send('didCreateWorkflow', {
        workflowId,
        hasRequiredStageToPublish
    });
};
const sendDidEditWorkflow = async (workflowId, hasRequiredStageToPublish)=>{
    strapi.telemetry.send('didEditWorkflow', {
        workflowId,
        hasRequiredStageToPublish
    });
};
const sendDidEditAssignee = async (fromId, toId)=>{
    strapi.telemetry.send('didEditAssignee', {
        from: fromId,
        to: toId
    });
};
const sendDidSendReviewWorkflowPropertiesOnceAWeek = async (numberOfActiveWorkflows, avgStagesCount, maxStagesCount, activatedContentTypes)=>{
    strapi.telemetry.send('didSendReviewWorkflowPropertiesOnceAWeek', {
        groupProperties: {
            numberOfActiveWorkflows,
            avgStagesCount,
            maxStagesCount,
            activatedContentTypes
        }
    });
};
var reviewWorkflowsMetrics = {
    sendDidCreateStage,
    sendDidEditStage,
    sendDidDeleteStage,
    sendDidChangeEntryStage,
    sendDidCreateWorkflow,
    sendDidEditWorkflow,
    sendDidSendReviewWorkflowPropertiesOnceAWeek,
    sendDidEditAssignee
};

export { reviewWorkflowsMetrics as default, sendDidChangeEntryStage, sendDidCreateStage, sendDidCreateWorkflow, sendDidDeleteStage, sendDidEditAssignee, sendDidEditStage, sendDidEditWorkflow, sendDidSendReviewWorkflowPropertiesOnceAWeek };
//# sourceMappingURL=index.mjs.map
