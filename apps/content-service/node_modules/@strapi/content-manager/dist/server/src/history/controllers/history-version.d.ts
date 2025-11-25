import type { Core } from '@strapi/types';
import type { HistoryVersions } from '../../../../shared/contracts';
declare const createHistoryVersionController: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    findMany(ctx: import("koa").Context): Promise<import("koa").Context | {
        data: any;
        meta: {
            pagination: HistoryVersions.Pagination;
        };
    }>;
    restoreVersion(ctx: import("koa").Context): Promise<{
        data: {
            documentId: string;
        };
    }>;
};
export { createHistoryVersionController };
//# sourceMappingURL=history-version.d.ts.map