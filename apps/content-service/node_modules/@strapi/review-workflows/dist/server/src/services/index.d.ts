declare const _default: {
    homepage: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        getRecentlyAssignedDocuments(): Promise<import("../../../shared/contracts/homepage").RecentDocument[]>;
    };
    workflows: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        find(opts?: any): Promise<any[]>;
        findById(id: any, opts?: {
            populate?: any;
        }): Promise<any>;
        create(opts: {
            data: any;
        }): Promise<any>;
        update(workflow: any, opts: any): Promise<any>;
        delete(workflow: any, opts: any): Promise<any>;
        count(): Promise<number>;
        getAssignedWorkflow(uid: any, opts?: any): Promise<any>;
        _getAssignedWorkflows(uid: any, opts?: {}): Promise<any[]>;
        assertContentTypeBelongsToWorkflow(uid: any): Promise<any>;
        assertStageBelongsToWorkflow(stageId: any, workflow: any): void;
    };
    stages: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        find({ workflowId, populate }: any): Promise<any[]>;
        findById(id: string | number, { populate }?: any): Promise<any>;
        createMany(stagesList: any, { fields }?: any): Promise<any[]>;
        update(srcStage: any, destStage: any): Promise<any>;
        delete(stage: any): Promise<any>;
        deleteMany(stages: any): Promise<import("@strapi/database/dist/types").CountResult>;
        deleteStagePermissions(stages: any): Promise<void>;
        count({ workflowId }?: any): Promise<number>;
        replaceStages(srcStages: any, destStages: any, contentTypesToMigrate?: never[]): Promise<any>;
        updateEntity(entityToUpdate: {
            id: string | number;
            documentId: string;
            locale: string;
            updatedAt: string;
        }, model: import("@strapi/types/dist/uid").ContentType, stageId: any): Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
        updateEntitiesStage(contentTypeUID: any, { fromStageId, toStageId }: any): Promise<number | number[]>;
        deleteAllEntitiesStage(contentTypeUID: any): Promise<number>;
    };
    'stage-permissions': ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        register({ roleId, action, fromStage }: any): Promise<any>;
        registerMany(permissions: any): Promise<any>;
        unregister(permissions: any): Promise<void>;
        can(action: any, fromStage: any): any;
    };
    assignees: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        findEntityAssigneeId(id: string | number, model: import("@strapi/types/dist/uid").ContentType): Promise<any>;
        updateEntityAssignee(entityToUpdate: {
            id: string | number;
            documentId: string;
            locale: string;
            updatedAt: string;
        }, model: import("@strapi/types/dist/uid").ContentType, assigneeId: string | null): Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
    };
    validation: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        limits: {
            numberOfWorkflows: number;
            stagesPerWorkflow: number;
        };
        register({ numberOfWorkflows, stagesPerWorkflow }: any): void;
        validateWorkflowStages(stages: any): void;
        validateWorkflowCountStages(workflowId: any, countAddedStages?: number): Promise<void>;
        validateWorkflowCount(countAddedWorkflows?: number): Promise<void>;
    };
    'document-service-middlewares': () => {
        assignStageOnCreate: import("@strapi/types/dist/modules/documents/middleware").Middleware;
        handleStageOnUpdate: import("@strapi/types/dist/modules/documents/middleware").Middleware;
        checkStageBeforePublish: import("@strapi/types/dist/modules/documents/middleware").Middleware;
    };
    'workflow-metrics': {
        sendDidCreateStage: () => Promise<void>;
        sendDidEditStage: () => Promise<void>;
        sendDidDeleteStage: () => Promise<void>;
        sendDidChangeEntryStage: () => Promise<void>;
        sendDidCreateWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
        sendDidEditWorkflow: (workflowId: string, hasRequiredStageToPublish: boolean) => Promise<void>;
        sendDidSendReviewWorkflowPropertiesOnceAWeek: (numberOfActiveWorkflows: number, avgStagesCount: number, maxStagesCount: number, activatedContentTypes: number) => Promise<void>;
        sendDidEditAssignee: (fromId: any, toId: any) => Promise<void>;
    };
    'workflow-weekly-metrics': ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        computeMetrics(): Promise<{
            numberOfActiveWorkflows: number;
            avgStagesCount: number;
            maxStagesCount: unknown;
            activatedContentTypes: number;
        }>;
        sendMetrics(): Promise<void>;
        ensureWeeklyStoredCronSchedule(): Promise<any>;
        registerCron(): Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map