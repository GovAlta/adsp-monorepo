import type { Core } from '@strapi/types';
import { Release } from '../../../shared/contracts/releases';
declare const createSchedulingService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    set(releaseId: Release['id'], scheduleDate: Date): Promise<Map<import("@strapi/types/dist/data").ID, string>>;
    cancel(releaseId: Release['id']): Map<import("@strapi/types/dist/data").ID, string>;
    getAll(): Map<import("@strapi/types/dist/data").ID, string>;
    /**
     * On bootstrap, we can use this function to make sure to sync the scheduled jobs from the database that are not yet released
     * This is useful in case the server was restarted and the scheduled jobs were lost
     * This also could be used to sync different Strapi instances in case of a cluster
     */
    syncFromDatabase(): Promise<Map<import("@strapi/types/dist/data").ID, string>>;
};
export default createSchedulingService;
//# sourceMappingURL=scheduling.d.ts.map