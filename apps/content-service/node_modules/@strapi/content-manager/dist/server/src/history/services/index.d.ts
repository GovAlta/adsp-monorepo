export declare const services: {
    history: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        createVersion(historyVersionData: import("../../../../shared/contracts/history-versions").CreateHistoryVersion): Promise<void>;
        findVersionsPage(params: import("../../../../shared/contracts/history-versions").GetHistoryVersions.Request): Promise<{
            results: import("../../../../shared/contracts/history-versions").HistoryVersionDataResponse[];
            pagination: import("../../../../shared/contracts/history-versions").Pagination;
        }>;
        restoreVersion(versionId: import("@strapi/types/dist/data").ID): Promise<import("@strapi/types/dist/modules/documents").AnyDocument>;
    };
    lifecycles: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        bootstrap(): Promise<void>;
        destroy(): Promise<void>;
    };
};
//# sourceMappingURL=index.d.ts.map