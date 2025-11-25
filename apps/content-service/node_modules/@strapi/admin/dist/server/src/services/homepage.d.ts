import { Core } from '@strapi/types';
import { HomepageLayout } from '../controllers/validation/schema';
export declare const homepageService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getKeyStatistics: () => Promise<{
        assets: number;
        contentTypes: number;
        components: number;
        locales: any;
        admins: number;
        webhooks: number;
        apiTokens: number;
    }>;
    getHomepageLayout: (userId: number) => Promise<HomepageLayout | null>;
    updateHomepageLayout: (userId: number, input: unknown) => Promise<HomepageLayout>;
};
//# sourceMappingURL=homepage.d.ts.map