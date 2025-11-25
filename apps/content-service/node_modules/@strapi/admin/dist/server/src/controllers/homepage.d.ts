import type { Context } from 'koa';
import { HomepageLayout } from './validation/schema';
declare const _default: {
    getKeyStatistics(): Promise<{
        data: {
            assets: number;
            contentTypes: number;
            components: number;
            locales: any;
            admins: number;
            webhooks: number;
            apiTokens: number;
        };
    }>;
    getHomepageLayout(ctx: Context): Promise<{
        data: HomepageLayout | null;
    }>;
    updateHomepageLayout(ctx: Context): Promise<{
        data: HomepageLayout;
    }>;
};
export default _default;
//# sourceMappingURL=homepage.d.ts.map