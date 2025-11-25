import type { Core } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    computeMetrics(): Promise<{
        numberOfActiveWorkflows: number;
        avgStagesCount: number;
        maxStagesCount: unknown;
        activatedContentTypes: number;
    }>;
    sendMetrics(): Promise<void>;
    ensureWeeklyStoredCronSchedule(): Promise<any>;
    registerCron(): Promise<void>;
};
export default _default;
//# sourceMappingURL=weekly-metrics.d.ts.map