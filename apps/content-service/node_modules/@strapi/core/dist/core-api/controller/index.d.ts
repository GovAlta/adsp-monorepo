import type { Core, Struct } from '@strapi/types';
declare function createController<T extends Struct.SingleTypeSchema | Struct.CollectionTypeSchema>(opts: {
    contentType: T;
}): T extends Struct.SingleTypeSchema ? Core.CoreAPI.Controller.SingleType : Core.CoreAPI.Controller.CollectionType;
export { createController };
//# sourceMappingURL=index.d.ts.map