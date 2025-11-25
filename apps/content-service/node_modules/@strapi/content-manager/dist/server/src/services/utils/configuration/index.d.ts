declare function createDefaultConfiguration(schema: any): Promise<{
    settings: any;
    metadatas: any;
    layouts: {
        edit: any;
        list: any;
    };
}>;
declare function syncConfiguration(conf: any, schema: any): Promise<{
    settings: any;
    layouts: {
        edit: any;
        list: any;
    } | {
        list: any;
        edit: any;
    };
    metadatas: any;
}>;
export { createDefaultConfiguration, syncConfiguration };
//# sourceMappingURL=index.d.ts.map