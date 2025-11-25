/**
 * Multiple workflows introduced the ability to name a workflow.
 * This migration adds the default workflow name if the name attribute was added.
 */
declare function migrateReviewWorkflowName({ oldContentTypes, contentTypes }: any): Promise<void>;
export default migrateReviewWorkflowName;
//# sourceMappingURL=set-workflow-default-name.d.ts.map