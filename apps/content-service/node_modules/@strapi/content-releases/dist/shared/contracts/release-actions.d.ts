import type { Schema, Modules, UID, Struct } from '@strapi/types';
import type { Release, Pagination } from './releases';
import type { Entity } from '../types';
import type { errors } from '@strapi/utils';
export type ReleaseActionEntry = Modules.Documents.AnyDocument & {
    [key: string]: Schema.Attribute.AnyAttribute;
} & {
    locale?: string;
};
export interface ReleaseAction extends Entity {
    type: 'publish' | 'unpublish';
    entry: ReleaseActionEntry;
    contentType: UID.ContentType;
    entryDocumentId: ReleaseActionEntry['documentId'];
    locale?: string;
    release: Release;
    isEntryValid: boolean;
    status: 'draft' | 'published' | 'modified';
}
export interface FormattedReleaseAction extends Entity {
    type: 'publish' | 'unpublish';
    entry: ReleaseActionEntry;
    contentType: {
        uid: UID.ContentType;
        mainFieldValue?: string;
        displayName: string;
    };
    locale?: {
        name: string;
        code: string;
    };
    release: Release;
    status: 'draft' | 'published' | 'modified';
}
/**
 * POST /content-releases/:releaseId/actions - Create a release action
 */
export declare namespace CreateReleaseAction {
    interface Request {
        params: {
            releaseId: Release['id'];
        };
        body: {
            type: ReleaseAction['type'];
            contentType: UID.ContentType;
            entryDocumentId?: ReleaseActionEntry['documentId'];
            locale?: ReleaseActionEntry['locale'];
        };
    }
    interface Response {
        data: ReleaseAction;
        error?: errors.ApplicationError | errors.ValidationError | errors.NotFoundError;
    }
}
/**
 * POST /content-releases/:releaseId/actions/bulk - Create multiple release actions
 */
export declare namespace CreateManyReleaseActions {
    interface Request {
        params: {
            releaseId: Release['id'];
        };
        body: Array<{
            type: ReleaseAction['type'];
            contentType: UID.ContentType;
            entryDocumentId: ReleaseActionEntry['documentId'];
            locale?: ReleaseActionEntry['locale'];
        }>;
    }
    interface Response {
        data: Array<ReleaseAction>;
        meta: {
            totalEntries: number;
            entriesAlreadyInRelease: number;
        };
        error?: errors.ApplicationError | errors.ValidationError | errors.NotFoundError;
    }
}
/**
 * GET /content-releases/:id/actions - Get all release actions
 */
export interface Stage extends Entity {
    color: string;
    name: string;
}
export type ReleaseActionGroupBy = 'contentType' | 'action' | 'locale';
export declare namespace GetReleaseActions {
    interface Request {
        params: {
            releaseId: Release['id'];
        };
        query?: Partial<Pick<Pagination, 'page' | 'pageSize'>> & {
            groupBy?: ReleaseActionGroupBy;
        };
    }
    interface Response {
        data: {
            [key: string]: Array<FormattedReleaseAction>;
        };
        meta: {
            pagination: Pagination;
            contentTypes: Record<Struct.ContentTypeSchema['uid'], Struct.ContentTypeSchema & {
                hasReviewWorkflow: boolean;
                stageRequiredToPublish?: Stage;
            }>;
            components: Record<Struct.ComponentSchema['uid'], Struct.ComponentSchema>;
        };
    }
}
export declare namespace DeleteReleaseAction {
    interface Request {
        params: {
            actionId: ReleaseAction['id'];
            releaseId: Release['id'];
        };
    }
    interface Response {
        data: ReleaseAction;
        error?: errors.ApplicationError | errors.NotFoundError;
    }
}
export declare namespace UpdateReleaseAction {
    interface Request {
        params: {
            actionId: ReleaseAction['id'];
            releaseId: ReleaseAction['id'];
        };
        body: {
            type: ReleaseAction['type'];
        };
    }
    interface Response {
        data: ReleaseAction;
        error?: errors.ApplicationError | errors.ValidationError | errors.NotFoundError;
    }
}
