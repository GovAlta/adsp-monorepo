import '@strapi/types';
export declare const sendDidCreateStage: () => Promise<void>;
export declare const sendDidEditStage: () => Promise<void>;
export declare const sendDidDeleteStage: () => Promise<void>;
export declare const sendDidChangeEntryStage: () => Promise<void>;
export declare const sendDidCreateWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
export declare const sendDidEditWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
export declare const sendDidEditAssignee: (fromId: any, toId: any) => Promise<void>;
export declare const sendDidSendReviewWorkflowPropertiesOnceAWeek: (numberOfActiveWorkflows: number, avgStagesCount: number, maxStagesCount: number, activatedContentTypes: number) => Promise<void>;
declare const _default: {
    sendDidCreateStage: () => Promise<void>;
    sendDidEditStage: () => Promise<void>;
    sendDidDeleteStage: () => Promise<void>;
    sendDidChangeEntryStage: () => Promise<void>;
    sendDidCreateWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
    sendDidEditWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
    sendDidSendReviewWorkflowPropertiesOnceAWeek: (numberOfActiveWorkflows: number, avgStagesCount: number, maxStagesCount: number, activatedContentTypes: number) => Promise<void>;
    sendDidEditAssignee: (fromId: any, toId: any) => Promise<void>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map