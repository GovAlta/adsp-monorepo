declare const _default: {
    'collection-types': {
        find(ctx: any): Promise<any>;
        findOne(ctx: any): Promise<any>;
        create(ctx: any): Promise<void>;
        update(ctx: any): Promise<void>;
        clone(ctx: any): Promise<any>;
        autoClone(ctx: any): Promise<any>;
        delete(ctx: any): Promise<any>;
        publish(ctx: any): Promise<any>;
        bulkPublish(ctx: any): Promise<any>;
        bulkUnpublish(ctx: any): Promise<any>;
        unpublish(ctx: any): Promise<any>;
        discard(ctx: any): Promise<any>;
        bulkDelete(ctx: any): Promise<any>;
        countDraftRelations(ctx: any): Promise<any>;
        countManyEntriesDraftRelations(ctx: any): Promise<any>;
    };
    components: {
        findComponents(ctx: any): void;
        findComponentConfiguration(ctx: any): Promise<any>;
        updateComponentConfiguration(ctx: any): Promise<any>;
    };
    'content-types': {
        findContentTypes(ctx: any): Promise<any>;
        findContentTypesSettings(ctx: any): Promise<void>;
        findContentTypeConfiguration(ctx: any): Promise<any>;
        updateContentTypeConfiguration(ctx: any): Promise<any>;
    };
    init: {
        getInitData(ctx: any): void;
    };
    relations: {
        extractAndValidateRequestInfo(ctx: any, id?: import("@strapi/types/dist/data").ID | undefined): Promise<any>;
        findAvailable(ctx: any): Promise<void>;
        findExisting(ctx: any): Promise<void>;
    };
    'single-types': {
        find(ctx: any): Promise<any>;
        createOrUpdate(ctx: any): Promise<void>;
        delete(ctx: any): Promise<any>;
        publish(ctx: any): Promise<any>;
        unpublish(ctx: any): Promise<any>;
        discard(ctx: any): Promise<any>;
        countDraftRelations(ctx: any): Promise<any>;
    };
    uid: {
        generateUID(ctx: any): Promise<void>;
        checkUIDAvailability(ctx: any): Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map