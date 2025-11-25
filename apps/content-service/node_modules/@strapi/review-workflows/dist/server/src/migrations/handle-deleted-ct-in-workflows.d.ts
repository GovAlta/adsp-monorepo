/**
 * Remove CT references from workflows if the CT is deleted
 */
declare function migrateDeletedCTInWorkflows({ oldContentTypes, contentTypes }: any): Promise<void>;
export default migrateDeletedCTInWorkflows;
//# sourceMappingURL=handle-deleted-ct-in-workflows.d.ts.map