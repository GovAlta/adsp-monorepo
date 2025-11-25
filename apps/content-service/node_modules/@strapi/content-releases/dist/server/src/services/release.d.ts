import type { Core, Data } from '@strapi/types';
import type { GetReleases, CreateRelease, UpdateRelease, PublishRelease, GetRelease, Release, DeleteRelease } from '../../../shared/contracts/releases';
import type { UserInfo } from '../../../shared/types';
declare const createReleaseService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    create(releaseData: CreateRelease.Request['body'], { user }: {
        user: UserInfo;
    }): Promise<any>;
    findOne(id: GetRelease.Request['params']['id'], query?: {}): Promise<any>;
    findPage(query?: GetReleases.Request['query']): Promise<{
        results: any[];
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    }>;
    findMany(query?: any): Promise<any[]>;
    update(id: Data.ID, releaseData: UpdateRelease.Request['body'], { user }: {
        user: UserInfo;
    }): Promise<any>;
    getAllComponents(): Promise<any>;
    delete(releaseId: DeleteRelease.Request['params']['id']): Promise<Release>;
    publish(releaseId: PublishRelease.Request['params']['id']): Promise<Pick<Release, "id" | "releasedAt" | "status"> | null>;
    updateReleaseStatus(releaseId: Release['id']): Promise<any>;
};
export type ReleaseService = ReturnType<typeof createReleaseService>;
export default createReleaseService;
//# sourceMappingURL=release.d.ts.map