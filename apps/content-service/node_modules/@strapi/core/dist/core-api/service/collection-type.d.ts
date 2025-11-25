import type { Core, Struct, Modules } from '@strapi/types';
import { CoreService } from './core-service';
export declare class CollectionTypeService extends CoreService implements Core.CoreAPI.Service.CollectionType {
    private contentType;
    constructor(contentType: Struct.CollectionTypeSchema);
    find(params?: {}): Promise<{
        results: Modules.Documents.AnyDocument[];
        pagination: import("@strapi/utils/dist/pagination").PagePatinationInformation | import("@strapi/utils/dist/pagination").OffsetPaginationInformation;
    }>;
    findOne(documentId: Modules.Documents.ID, params?: {}): import("@strapi/types/dist/modules/documents/result/document-engine").FindOne<import("@strapi/types/dist/uid").ContentType, any>;
    create(params?: {
        data: {};
    }): Promise<Modules.Documents.AnyDocument>;
    update(documentId: Modules.Documents.ID, params?: {
        data: {};
    }): import("@strapi/types/dist/modules/documents/result/document-engine").Update<import("@strapi/types/dist/uid").ContentType, any>;
    delete(documentId: Modules.Documents.ID, params?: {}): Promise<{
        deletedEntries: number;
    }>;
}
/**
 *
 * Returns a collection type service to handle default core-api actions
 */
declare const createCollectionTypeService: (contentType: Struct.CollectionTypeSchema) => Core.CoreAPI.Service.CollectionType;
export { createCollectionTypeService };
//# sourceMappingURL=collection-type.d.ts.map