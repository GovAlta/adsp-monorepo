import type { Core } from '@strapi/types';
import type { GetUpcomingReleases } from '../../../shared/contracts/homepage';
declare const createHomepageService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getUpcomingReleases(): Promise<GetUpcomingReleases.Response['data']>;
};
export default createHomepageService;
//# sourceMappingURL=homepage.d.ts.map