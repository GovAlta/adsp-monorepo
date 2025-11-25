declare function createDefaultLayouts(schema: any): Promise<{
    edit: any;
    list: any;
}>;
/** Synchronisation functions */
declare function syncLayouts(configuration: any, schema: any): Promise<{
    edit: any;
    list: any;
}> | {
    list: any;
    edit: any;
};
export { createDefaultLayouts, syncLayouts };
//# sourceMappingURL=layouts.d.ts.map