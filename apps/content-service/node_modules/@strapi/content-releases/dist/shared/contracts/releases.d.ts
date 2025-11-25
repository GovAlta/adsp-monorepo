import type { Entity } from '../types';
import type { ReleaseAction } from './release-actions';
import type { UserInfo } from '../types';
import { errors } from '@strapi/utils';
import type { SanitizedAdminUser } from '@strapi/admin/strapi-admin';
export interface Release extends Entity {
    name: string;
    releasedAt: string | null;
    scheduledAt: string | null;
    status: 'ready' | 'blocked' | 'failed' | 'done' | 'empty';
    timezone: string | null;
    actions: ReleaseAction[];
}
export type Pagination = {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
};
export interface ReleaseDataResponse extends Omit<Release, 'actions'> {
    actions: {
        meta: {
            count: number;
        };
    };
    createdBy: SanitizedAdminUser;
}
export interface ReleaseForContentTypeEntryDataResponse extends Omit<Release, 'actions'> {
    actions: ReleaseAction[];
}
/**
 * GET /content-releases/ - Get releases paginated
 */
export declare namespace GetReleases {
    interface Request {
        state: {
            userAbility: {};
        };
        query?: Partial<Pick<Pagination, 'page' | 'pageSize'>>;
    }
    interface Response {
        data: ReleaseDataResponse[];
        meta: {
            pagination?: Pagination;
            pendingReleasesCount?: number;
        };
        error?: errors.ApplicationError;
    }
}
/**
 * GET /content-releases/findByDocumentAttached - Get releases paginated
 */
export declare namespace GetReleasesByDocumentAttached {
    interface Request {
        state: {
            userAbility: {};
        };
        query: {
            contentType: string;
            entryDocumentId: ReleaseAction['entry']['entryDocumentId'];
            locale?: string;
            hasEntryAttached?: boolean;
        };
    }
    interface Response {
        data: ReleaseForContentTypeEntryDataResponse[];
        error?: errors.ApplicationError;
    }
}
/**
 * GET /content-releases/mapEntriesToReleases - Map entries to releases
 */
export declare namespace MapEntriesToReleases {
    interface Request {
        query: {
            contentTypeUid: ReleaseAction['contentType'];
            documentIds: ReleaseAction['entryDocumentId'][];
            locale?: ReleaseAction['locale'];
        };
    }
    interface Response {
        data: {
            [documentId: ReleaseAction['entryDocumentId']]: Pick<Release, 'id' | 'name'>[];
        };
    }
}
/**
 * GET /content-releases/:id - Get a single release
 */
export declare namespace GetRelease {
    interface Request {
        state: {
            userAbility: {};
        };
        params: {
            id: Release['id'];
        };
    }
    interface Response {
        data: ReleaseDataResponse;
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
/**
 * POST /content-releases/ - Create a release
 */
export declare namespace CreateRelease {
    interface Request {
        state: {
            user: UserInfo;
        };
        body: {
            name: string;
            scheduledAt: Date | null;
            timezone: string | null;
        };
    }
    interface Response {
        data: ReleaseDataResponse;
        error?: errors.ApplicationError | errors.ValidationError;
    }
}
/**
 * PUT /content-releases/:id - Update a release
 */
export declare namespace UpdateRelease {
    interface Request {
        state: {
            user: UserInfo;
        };
        params: {
            id: Release['id'];
        };
        body: {
            name: string;
            scheduledAt?: Date | null;
            timezone?: string | null;
        };
    }
    interface Response {
        data: ReleaseDataResponse;
        error?: errors.ApplicationError | errors.ValidationError;
    }
}
/**
 * DELETE /content-releases/:id - Delete a release
 */
export declare namespace DeleteRelease {
    interface Request {
        state: {
            user: UserInfo;
        };
        params: {
            id: Release['id'];
        };
    }
    interface Response {
        data: ReleaseDataResponse;
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
/**
 * POST /content-releases/:releaseId/publish - Publish a release
 */
export declare namespace PublishRelease {
    interface Request {
        state: {
            user: UserInfo;
        };
        params: {
            id: Release['id'];
        };
    }
    interface Response {
        data: ReleaseDataResponse;
        meta: {
            totalEntries: number;
            totalPublishedEntries: number;
            totalUnpublishedEntries: number;
        };
        error?: errors.ApplicationError | errors.ValidationError;
    }
}
