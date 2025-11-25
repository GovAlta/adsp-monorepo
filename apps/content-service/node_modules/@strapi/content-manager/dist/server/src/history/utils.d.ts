import type { Core } from '@strapi/types';
type HistoryServices = typeof import('./services').services;
declare function getService<T extends keyof HistoryServices>(strapi: Core.Strapi, name: T): ReturnType<{
    history: ({ strapi }: {
        strapi: Core.Strapi;
    }) => {
        createVersion(historyVersionData: import("../../../shared/contracts/history-versions").CreateHistoryVersion): Promise<void>;
        findVersionsPage(params: import("../../../shared/contracts/history-versions").GetHistoryVersions.Request): Promise<{
            results: import("../../../shared/contracts/history-versions").HistoryVersionDataResponse[];
            pagination: import("../../../shared/contracts/history-versions").Pagination;
        }>;
        restoreVersion(versionId: import("@strapi/types/dist/data").ID): Promise<import("@strapi/types/dist/modules/documents").AnyDocument>;
    };
    lifecycles: ({ strapi }: {
        strapi: Core.Strapi;
    }) => {
        bootstrap(): Promise<void>;
        destroy(): Promise<void>;
    };
}[T]>;
export { getService };
//# sourceMappingURL=utils.d.ts.map