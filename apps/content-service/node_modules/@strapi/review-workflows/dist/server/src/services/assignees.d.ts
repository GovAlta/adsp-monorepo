import type { Core, UID, Modules } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    findEntityAssigneeId(id: string | number, model: UID.ContentType): Promise<any>;
    /**
     * Update the assignee of an entity
     */
    updateEntityAssignee(entityToUpdate: {
        id: number | string;
        documentId: string;
        locale: string;
        updatedAt: string;
    }, model: UID.ContentType, assigneeId: string | null): Promise<Modules.Documents.AnyDocument | null>;
};
export default _default;
//# sourceMappingURL=assignees.d.ts.map