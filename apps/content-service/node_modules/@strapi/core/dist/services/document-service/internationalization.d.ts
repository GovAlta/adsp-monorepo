/// <reference types="lodash" />
import type { Struct, Modules } from '@strapi/types';
/**
 * Copy non-localized fields from an existing entry to a new entry being created
 * for a different locale of the same document. Returns a new object with the merged data.
 */
declare const copyNonLocalizedFields: (contentType: Struct.SingleTypeSchema | Struct.CollectionTypeSchema, documentId: string, dataToCreate: Record<string, any>) => Promise<Record<string, any>>;
declare const defaultLocaleCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Promise<Modules.Documents.Params.All>>;
declare const localeToLookupCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const multiLocaleToLookupCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const localeToDataCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
export { defaultLocaleCurry as defaultLocale, localeToLookupCurry as localeToLookup, localeToDataCurry as localeToData, multiLocaleToLookupCurry as multiLocaleToLookup, copyNonLocalizedFields, };
//# sourceMappingURL=internationalization.d.ts.map