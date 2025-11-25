import type { UID } from '@strapi/types';
interface Options {
    allowMultipleLocales?: boolean;
}
/**
 * From a request or query object, validates and returns the locale and status of the document.
 * If the status is not provided and Draft & Publish is disabled, it defaults to 'published'.
 */
export declare const getDocumentLocaleAndStatus: (request: any, model: UID.Schema, opts?: Options) => Promise<any>;
export {};
//# sourceMappingURL=dimensions.d.ts.map