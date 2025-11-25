import { errors } from '@strapi/utils';
import type { Modules, Struct, UID } from '@strapi/types';
type PaginatedDocuments = Modules.Documents.PaginatedResult<UID.Schema>;
type SortQuery = Modules.Documents.Params.Sort.StringNotation<UID.Schema> & string;
type Document = Modules.Documents.Document<any>;
type AT_FIELDS = 'updatedAt' | 'createdAt' | 'publishedAt';
type BY_FIELDS = 'createdBy' | 'updatedBy' | 'publishedBy';
export type AvailableLocaleDocument = Pick<Document, 'id' | 'locale' | AT_FIELDS | 'status'>;
export type AvailableStatusDocument = Pick<Document, 'id' | 'documentId' | 'locale' | BY_FIELDS | AT_FIELDS>;
export type DocumentMetadata = {
    availableStatus: AvailableStatusDocument[];
    availableLocales: AvailableLocaleDocument[];
};
/**
 * GET /collection-types/:model
 */
export declare namespace Find {
    interface Request {
        body: {};
        query: {
            page?: string;
            pageSize?: string;
            sort?: SortQuery;
        };
    }
    interface Params {
        model: string;
    }
    interface Response extends PaginatedDocuments {
        error?: errors.ApplicationError;
    }
}
/**
 * GET /collection-types/:model/:id
 */
export declare namespace FindOne {
    interface Request {
        body: {};
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /collection-types/:model
 */
export declare namespace Create {
    interface Request {
        body: Struct.SchemaAttributes;
        query: {};
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
export type ProhibitedCloningField = [fieldNames: string[], 'unique' | 'relation'];
/**
 * POST /collection-types/:model/auto-clone/:sourceId
 */
export declare namespace AutoClone {
    interface Request {
        body: {};
    }
    interface Params {
        model: string;
        sourceId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError<'BadRequestError', string, {
            prohibitedFields: ProhibitedCloningField[];
        }>;
    }
}
/**
 * POST /collection-types/:model/clone/:sourceId
 */
export declare namespace Clone {
    interface Request {
        body: Struct.SchemaAttributes;
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        sourceId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * PUT /collection-types/:model/:id
 */
export declare namespace Update {
    interface Request {
        body: Partial<Document>;
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * DELETE /collection-types/:model/:id
 */
export declare namespace Delete {
    interface Request {
        body: {};
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /collection-types/:model/actions/publish
 */
export declare namespace PublishAndCreate {
    interface Request {
        body: Partial<Document>;
        query: {
            locale?: string | null;
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
 * POST /collection-types/:model/:id/actions/publish
 */
export declare namespace Publish {
    interface Request {
        body: Partial<Document>;
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /collection-types/:model/:id/actions/unpublish
 *
 * TODO: Unpublish many locales at once
 */
export declare namespace Unpublish {
    interface Request {
        body: {
            discardDraft?: boolean;
        };
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /collection-types/:model/:id/actions/discard
 */
export declare namespace Discard {
    interface Request {
        body: {};
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
        documentId: Modules.Documents.ID;
    }
    interface Response {
        data: Document;
        meta: DocumentMetadata;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /collection-types/:model/actions/bulkDelete
 */
export declare namespace BulkDelete {
    interface Request {
        body: {
            documentIds: Modules.Documents.ID[];
        };
        query: {
            locale?: string;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: {
            count: number;
        };
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * POST /collection-types/:model/actions/bulkPublish
 */
export declare namespace BulkPublish {
    interface Request {
        body: {
            documentIds: Modules.Documents.ID[];
        };
        query: {
            locale?: string | string[] | null;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: {
            count: number;
        };
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * POST /collection-types/:model/actions/bulkUnpublish
 */
export declare namespace BulkUnpublish {
    interface Request {
        body: {
            documentIds: Modules.Documents.ID[];
        };
        query: {
            locale?: string | string[] | null;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: {
            count: number;
        };
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * GET /collection-types/:model/:id/actions/countDraftRelations
 */
export declare namespace CountDraftRelations {
    interface Request {
        body: {};
        query: {
            locale?: string | null;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: number;
        error?: errors.ApplicationError;
    }
}
/**
 * GET /collection-types/:model/actions/countManyEntriesDraftRelations
 */
export declare namespace CountManyEntriesDraftRelations {
    interface Request {
        body: {};
        query: {
            documentIds?: Modules.Documents.ID[];
            locale?: string | string[] | null;
        };
    }
    interface Params {
        model: string;
    }
    interface Response {
        data: number;
        error?: errors.ApplicationError;
    }
}
export {};
