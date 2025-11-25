import type { Struct, Core } from '@strapi/types';
import { CoreService } from './core-service';
export declare class SingleTypeService extends CoreService implements Core.CoreAPI.Service.SingleType {
    private contentType;
    constructor(contentType: Struct.SingleTypeSchema);
    getDocumentId(): Promise<string>;
    find(params?: {}): Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
    createOrUpdate(params?: {}): Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
    delete(params?: {}): Promise<{
        deletedEntries: number;
    }>;
}
declare const createSingleTypeService: (contentType: Struct.SingleTypeSchema) => Core.CoreAPI.Service.SingleType;
export { createSingleTypeService };
//# sourceMappingURL=single-type.d.ts.map