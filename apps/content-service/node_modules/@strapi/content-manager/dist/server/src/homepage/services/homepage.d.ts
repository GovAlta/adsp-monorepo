/// <reference types="node" />
import type { Core } from '@strapi/types';
import type { GetCountDocuments, GetRecentDocuments, RecentDocument } from '../../../../shared/contracts/homepage';
declare const createHomepageService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    addStatusToDocuments(documents: RecentDocument[]): Promise<RecentDocument[]>;
    queryLastDocuments(additionalQueryParams?: Record<string, unknown>, draftAndPublishOnly?: boolean): Promise<RecentDocument[]>;
    getRecentlyPublishedDocuments(): Promise<GetRecentDocuments.Response['data']>;
    getRecentlyUpdatedDocuments(): Promise<GetRecentDocuments.Response['data']>;
    getCountDocuments(): Promise<GetCountDocuments.Response['data']>;
};
export { createHomepageService };
//# sourceMappingURL=homepage.d.ts.map