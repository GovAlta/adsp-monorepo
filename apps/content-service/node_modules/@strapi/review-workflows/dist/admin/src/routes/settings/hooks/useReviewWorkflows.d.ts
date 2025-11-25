import { GetWorkflowsParams } from '../../../services/settings';
import type { Create, Update } from '../../../../../shared/contracts/review-workflows';
type UseReviewWorkflowsArgs = GetWorkflowsParams & {
    skip?: boolean;
};
declare const useReviewWorkflows: (params?: UseReviewWorkflowsArgs) => {
    meta: {
        workflowCount: number;
    } | undefined;
    workflows: import("../../../../../shared/contracts/review-workflows").Workflow[];
    isLoading: boolean;
    error: import("@strapi/admin/strapi-admin").BaseQueryError | import("@reduxjs/toolkit").SerializedError | undefined;
    create: (data: Create.Request['body']['data']) => Promise<{
        data: import("../../../../../shared/contracts/review-workflows").Workflow;
    } | {
        error: import("@strapi/admin/strapi-admin").BaseQueryError | import("@reduxjs/toolkit").SerializedError;
    }>;
    delete: (id: string) => Promise<import("../../../../../shared/contracts/review-workflows").Workflow | undefined>;
    update: (id: string, data: Update.Request['body']['data']) => Promise<{
        data: import("../../../../../shared/contracts/review-workflows").Workflow;
    } | {
        error: import("@strapi/admin/strapi-admin").BaseQueryError | import("@reduxjs/toolkit").SerializedError;
    }>;
};
export { useReviewWorkflows };
