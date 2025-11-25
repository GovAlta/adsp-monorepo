import { errors } from '@strapi/utils';
import { Entity } from './shared';
export interface Locale extends Entity {
    code: string;
    isDefault: boolean;
    name: string;
}
/**
 * GET /i18n/locales - Get all the locales
 */
export declare namespace GetLocales {
    interface Request {
        query: {};
        body: {};
    }
    /**
     * TODO: this should follow the usual `data/error` pattern.
     */
    type Response = Locale[] | {
        data: null;
        error: errors.ApplicationError;
    };
}
/**
 * POST /i18n/locales - Create a single locale
 */
export declare namespace CreateLocale {
    interface Request {
        query: {};
        body: Omit<Locale, keyof Entity>;
    }
    /**
     * TODO: this should follow the usual `data/error` pattern.
     */
    type Response = Locale | {
        data: null;
        error: errors.ApplicationError;
    };
}
/**
 * DEL /i18n/locales/:id - Delete a single locale
 */
export declare namespace DeleteLocale {
    interface Request {
        query: {};
        body: {};
    }
    interface Params {
        id: Locale['id'];
    }
    /**
     * TODO: this should follow the usual `data/error` pattern.
     */
    type Response = Locale | {
        data: null;
        error: errors.ApplicationError;
    };
}
/**
 * PUT /i18n/locales/:id - Update a single locale
 */
export declare namespace UpdateLocale {
    interface Request {
        query: {};
        body: Pick<Locale, 'name' | 'isDefault'>;
    }
    interface Params {
        id: Locale['id'];
    }
    /**
     * TODO: this should follow the usual `data/error` pattern.
     */
    type Response = Locale | {
        data: null;
        error: errors.ApplicationError;
    };
}
