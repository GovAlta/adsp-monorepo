import type { UID, Modules } from '@strapi/types';
declare const createEntriesService: (uid: UID.ContentType, entityValidator: Modules.EntityValidator.EntityValidator) => {
    create: (params?: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
    update: (entryToUpdate: any, params?: any) => Promise<any>;
    publish: (entry: any, params?: any) => Promise<object>;
    discardDraft: (entry: any, params?: any) => Promise<object>;
};
export { createEntriesService };
//# sourceMappingURL=entries.d.ts.map