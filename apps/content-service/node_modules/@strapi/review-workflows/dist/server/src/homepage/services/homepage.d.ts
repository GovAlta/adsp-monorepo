import type { Core } from '@strapi/types';
import type { GetRecentlyAssignedDocuments } from '../../../../shared/contracts/homepage';
declare const createHomepageService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getRecentlyAssignedDocuments(): Promise<GetRecentlyAssignedDocuments.Response['data']>;
};
export { createHomepageService };
//# sourceMappingURL=homepage.d.ts.map