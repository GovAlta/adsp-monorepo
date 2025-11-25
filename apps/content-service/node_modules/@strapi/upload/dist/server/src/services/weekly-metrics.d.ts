import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    computeMetrics(): Promise<{
        assetNumber: number;
        folderNumber: number;
        averageDepth: number;
        maxDepth: number;
        averageDeviationDepth: number;
    }>;
    sendMetrics(): Promise<void>;
    ensureWeeklyStoredCronSchedule(): Promise<string>;
    registerCron(): Promise<void>;
};
export default _default;
//# sourceMappingURL=weekly-metrics.d.ts.map