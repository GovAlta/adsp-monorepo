import { pagination } from '@strapi/utils';
import type { Core, Modules, UID } from '@strapi/types';
type DocService = Modules.Documents.ServiceInstance;
type DocServiceParams<TAction extends keyof DocService> = Parameters<DocService[TAction]>[0];
export type Document = Modules.Documents.Result<UID.ContentType>;
declare const documentManager: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    findOne(id: string, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'findOne'>, 'documentId'>): Promise<Modules.Documents.AnyDocument | null>;
    /**
     * Find multiple (or all) locales for a document
     */
    findLocales(id: string | string[] | undefined, uid: UID.CollectionType, opts: {
        populate?: Modules.Documents.Params.Pick<any, 'populate'>;
        locale?: string | string[] | '*';
        isPublished?: boolean;
    }): Promise<any[]>;
    findMany(opts: DocServiceParams<'findMany'>, uid: UID.CollectionType): Promise<Modules.Documents.AnyDocument[]>;
    findPage(opts: DocServiceParams<'findMany'>, uid: UID.CollectionType): Promise<{
        results: Modules.Documents.AnyDocument[];
        pagination: pagination.PagePatinationInformation;
    }>;
    create(uid: UID.CollectionType, opts?: DocServiceParams<'create'>): Promise<Modules.Documents.AnyDocument>;
    update(id: Modules.Documents.ID, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'update'>, 'documentId'>): Promise<Modules.Documents.AnyDocument | null>;
    clone(id: Modules.Documents.ID, body: Partial<Modules.Documents.Params.Data.Input<UID.CollectionType>>, uid: UID.CollectionType): Promise<Modules.Documents.AnyDocument | undefined>;
    /**
     *  Check if a document exists
     */
    exists(uid: UID.CollectionType, id?: string): Promise<boolean>;
    delete(id: Modules.Documents.ID, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'delete'>, 'documentId'>): Promise<{}>;
    deleteMany(documentIds: Modules.Documents.ID[], uid: UID.CollectionType, opts?: DocServiceParams<'findMany'> & {
        locale?: string;
    }): Promise<{
        count: number;
    }>;
    publish(id: Modules.Documents.ID, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'publish'>, 'documentId'>): Promise<Modules.Documents.AnyDocument[]>;
    publishMany(uid: UID.ContentType, documentIds: string[], locale?: string | string[]): Promise<number>;
    unpublishMany(documentIds: Modules.Documents.ID[], uid: UID.CollectionType, opts?: Omit<DocServiceParams<'unpublish'>, 'documentId'>): Promise<{
        count: number;
    }>;
    unpublish(id: Modules.Documents.ID, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'unpublish'>, 'documentId'>): Promise<Modules.Documents.AnyDocument | undefined>;
    discardDraft(id: Modules.Documents.ID, uid: UID.CollectionType, opts?: Omit<DocServiceParams<'discardDraft'>, 'documentId'>): Promise<Modules.Documents.AnyDocument | undefined>;
    countDraftRelations(id: string, uid: UID.ContentType, locale: string): Promise<number>;
    countManyEntriesDraftRelations(documentIds: Modules.Documents.ID[], uid: UID.CollectionType, locale: string | string[]): Promise<number>;
};
export type DocumentManagerService = typeof documentManager;
export default documentManager;
//# sourceMappingURL=document-manager.d.ts.map