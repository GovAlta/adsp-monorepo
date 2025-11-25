import type { Data, UID } from '@strapi/types';
import { type errors } from '@strapi/utils';
/**
 * GET /content-manager/preview/url/:uid
 */
export declare namespace GetPreviewUrl {
    interface Request {
        params: {
            contentType: UID.ContentType;
        };
        query: {
            documentId?: Data.DocumentID;
            locale?: string;
            status?: 'published' | 'draft';
        };
    }
    type Response = {
        data: {
            url: string | undefined;
        };
        error?: never;
    } | {
        data?: never;
        error: errors.ApplicationError | errors.ValidationError | errors.NotFoundError;
    };
}
