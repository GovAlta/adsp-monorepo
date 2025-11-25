import type { Modules } from '@strapi/types';
import { errors } from '@strapi/utils';
type Document = Modules.Documents.Document<any>;
type AT_FIELDS = 'updatedAt' | 'createdAt' | 'publishedAt';
type BY_FIELDS = 'createdBy' | 'updatedBy' | 'publishedBy';
type DocumentMetadata = {
    availableStatus: Pick<Document, 'id' | BY_FIELDS | AT_FIELDS>[];
    availableLocales: Pick<Document, 'id' | 'locale' | 'status' | AT_FIELDS>[];
};
/**
 * GET /single-types/:model
 */
export declare namespace Find {
    interface Request {
        body: {};
        query: {
            locale: string;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * PUT /single-types/:model
 */
export declare namespace CreateOrUpdate {
    interface Request {
        body: Document;
        query: {
            plugins: {
                i18n: {
                    locale: string;
                };
            };
        };
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * DELETE /single-types/:model
 */
export declare namespace Delete {
    interface Request {
        body: {};
        query: {
            locale: string;
        };
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /single-types/:model/actions/publish
 */
export declare namespace Publish {
    interface Request {
        body: {};
        query: {
            locale: string;
        };
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /single-types/:model/actions/unpublish
 */
export declare namespace UnPublish {
    interface Request {
        body: {
            discardDraft?: boolean;
        };
        query: {
            locale: string;
        };
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * GET /single-types/:model/actions/countDraftRelations
 */
export declare namespace CountDraftRelations {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: number;
        error?: errors.ApplicationError;
    }
}
export {};
