declare const exportObject: {
    builder: {
        getReservedNames(ctx: import("koa").Context): void;
    };
    'component-categories': {
        editCategory(ctx: import("koa").Context): Promise<any>;
        deleteCategory(ctx: import("koa").Context): Promise<void>;
    };
    components: {
        getComponents(ctx: import("koa").Context): Promise<void>;
        getComponent(ctx: import("koa").Context): Promise<any>;
        createComponent(ctx: import("koa").Context): Promise<any>;
        updateComponent(ctx: import("koa").Context): Promise<any>;
        deleteComponent(ctx: import("koa").Context): Promise<any>;
    };
    'content-types': {
        getContentTypes(ctx: import("koa").Context): Promise<any>;
        getContentType(ctx: import("koa").Context): any;
        createContentType(ctx: import("koa").Context): Promise<any>;
        updateContentType(ctx: import("koa").Context): Promise<any>;
        deleteContentType(ctx: import("koa").Context): Promise<any>;
    };
    schema: () => {
        getSchema(ctx: import("koa").Context): Promise<void>;
        updateSchema(ctx: import("koa").Context): Promise<any>;
        getUpdateSchemaStatus(ctx: import("koa").Context): Promise<void>;
    };
};
export default exportObject;
//# sourceMappingURL=index.d.ts.map