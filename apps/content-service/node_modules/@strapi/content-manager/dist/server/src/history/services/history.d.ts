/// <reference types="node" />
import type { Core, Data, Modules } from '@strapi/types';
import type { HistoryVersions } from '../../../../shared/contracts';
import type { CreateHistoryVersion, HistoryVersionDataResponse } from '../../../../shared/contracts/history-versions';
declare const createHistoryService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    createVersion(historyVersionData: HistoryVersions.CreateHistoryVersion): Promise<void>;
    findVersionsPage(params: HistoryVersions.GetHistoryVersions.Request): Promise<{
        results: HistoryVersions.HistoryVersionDataResponse[];
        pagination: HistoryVersions.Pagination;
    }>;
    restoreVersion(versionId: Data.ID): Promise<Modules.Documents.AnyDocument>;
};
export { createHistoryService };
//# sourceMappingURL=history.d.ts.map