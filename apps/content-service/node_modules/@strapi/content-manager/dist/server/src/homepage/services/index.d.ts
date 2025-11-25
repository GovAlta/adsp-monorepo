export declare const services: {
    homepage: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        addStatusToDocuments(documents: import("../../../../shared/contracts/homepage").RecentDocument[]): Promise<import("../../../../shared/contracts/homepage").RecentDocument[]>;
        queryLastDocuments(additionalQueryParams?: Record<string, unknown> | undefined, draftAndPublishOnly?: boolean | undefined): Promise<import("../../../../shared/contracts/homepage").RecentDocument[]>;
        getRecentlyPublishedDocuments(): Promise<import("../../../../shared/contracts/homepage").RecentDocument[]>;
        getRecentlyUpdatedDocuments(): Promise<import("../../../../shared/contracts/homepage").RecentDocument[]>;
        getCountDocuments(): Promise<{
            draft: number;
            published: number;
            modified: number;
        }>;
    };
};
//# sourceMappingURL=index.d.ts.map