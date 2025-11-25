import type { Data, Modules } from '@strapi/types';
import { errors } from '@strapi/utils';
/**
 * POST /i18n/content-manager/actions/get-non-localized-fields - Get the localized fields
 */
export declare namespace GetNonLocalizedFields {
    interface Request {
        query: {};
        body: {
            id?: Data.ID;
            locale?: string;
            model: string;
        };
    }
    /**
     * TODO: this should follow the usual `data/error` pattern.
     */
    interface Response {
        nonLocalizedFields: object;
        localizations: Array<{
            id: Data.ID;
            locale: string;
            publishedAt: string | null;
        }>;
        error?: errors.ApplicationError;
    }
}
/**
 * GET content-manager/collection-types/:model/actions/countManyEntriesDraftRelations
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
