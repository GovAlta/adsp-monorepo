declare const _default: {
    find(ctx: any): Promise<any>;
    findOne(ctx: any): Promise<any>;
    create(ctx: any): Promise<void>;
    update(ctx: any): Promise<void>;
    clone(ctx: any): Promise<any>;
    autoClone(ctx: any): Promise<any>;
    delete(ctx: any): Promise<any>;
    /**
     * Publish a document version.
     * Supports creating/saving a document and publishing it in one request.
     */
    publish(ctx: any): Promise<any>;
    bulkPublish(ctx: any): Promise<any>;
    bulkUnpublish(ctx: any): Promise<any>;
    unpublish(ctx: any): Promise<any>;
    discard(ctx: any): Promise<any>;
    bulkDelete(ctx: any): Promise<any>;
    countDraftRelations(ctx: any): Promise<any>;
    countManyEntriesDraftRelations(ctx: any): Promise<any>;
};
export default _default;
//# sourceMappingURL=collection-types.d.ts.map