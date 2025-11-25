import type { Core, Struct } from '@strapi/types';
/**
 * Returns a core api for the provided model
 */
declare function createService<T extends Struct.SingleTypeSchema | Struct.CollectionTypeSchema>(opts: {
    contentType: T;
}): T extends Struct.SingleTypeSchema ? Core.CoreAPI.Service.SingleType : Core.CoreAPI.Service.CollectionType;
export { createService };
//# sourceMappingURL=index.d.ts.map