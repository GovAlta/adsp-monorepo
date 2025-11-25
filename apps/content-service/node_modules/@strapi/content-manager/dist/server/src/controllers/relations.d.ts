import type { Data } from '@strapi/types';
declare const _default: {
    extractAndValidateRequestInfo(ctx: any, id?: Data.ID): Promise<any>;
    /**
     * Used to find new relations to add in a relational field.
     *
     * Component and document relations are dealt a bit differently (they don't have a document_id).
     */
    findAvailable(ctx: any): Promise<void>;
    findExisting(ctx: any): Promise<void>;
};
export default _default;
//# sourceMappingURL=relations.d.ts.map