import type { UID, Modules } from '@strapi/types';
export type Populate = Modules.EntityService.Params.Populate.Any<UID.Schema>;
type PopulateOptions = {
    initialPopulate?: Populate;
    countMany?: boolean;
    countOne?: boolean;
    maxLevel?: number;
};
/**
 * Deeply populate a model based on UID
 * @param uid - Unique identifier of the model
 * @param options - Options to apply while populating
 * @param level - Current level of nested call
 */
declare const getDeepPopulate: (uid: UID.Schema, { initialPopulate, countMany, countOne, maxLevel, }?: PopulateOptions, level?: number) => {};
/**
 * Deeply populate a model based on UID. Only populating fields that require validation.
 * @param uid - Unique identifier of the model
 * @param options - Options to apply while populating
 * @param level - Current level of nested call
 */
declare const getPopulateForValidation: (uid: UID.Schema) => Record<string, any>;
/**
 * getDeepPopulateDraftCount works recursively on the attributes of a model
 * creating a populated object to count all the unpublished relations within the model
 * These relations can be direct to this content type or contained within components/dynamic zones
 * @param  uid of the model
 * @returns result
 * @returns result.populate
 * @returns result.hasRelations
 */
declare const getDeepPopulateDraftCount: (uid: UID.Schema) => {
    populate: any;
    hasRelations: boolean;
};
/**
 *  Create a Strapi populate object which populates all attribute fields of a Strapi query.
 */
declare const getQueryPopulate: (uid: UID.Schema, query: object) => Promise<Populate>;
declare const buildDeepPopulate: (uid: UID.CollectionType) => any;
export { getDeepPopulate, getDeepPopulateDraftCount, getPopulateForValidation, getQueryPopulate, buildDeepPopulate, };
//# sourceMappingURL=populate.d.ts.map