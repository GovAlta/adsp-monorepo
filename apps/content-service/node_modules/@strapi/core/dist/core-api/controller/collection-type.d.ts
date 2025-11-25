import type { Core, Struct, Utils } from '@strapi/types';
interface Options {
    contentType: Struct.CollectionTypeSchema;
}
/**
 *
 * Returns a collection type controller to handle default core-api actions
 */
declare const createCollectionTypeController: ({ contentType, }: Options) => Utils.PartialWithThis<Core.CoreAPI.Controller.CollectionType>;
export { createCollectionTypeController };
//# sourceMappingURL=collection-type.d.ts.map