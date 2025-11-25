import type { Struct, Core, Utils } from '@strapi/types';
interface Options {
    contentType: Struct.SingleTypeSchema;
}
/**
 * Returns a single type controller to handle default core-api actions
 */
declare const createSingleTypeController: ({ contentType, }: Options) => Utils.PartialWithThis<Core.CoreAPI.Controller.SingleType>;
export { createSingleTypeController };
//# sourceMappingURL=single-type.d.ts.map