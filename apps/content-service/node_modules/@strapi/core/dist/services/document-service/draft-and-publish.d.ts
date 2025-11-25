/// <reference types="lodash" />
import type { Modules, Struct } from '@strapi/types';
declare const setStatusToDraftCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const defaultToDraftCurry: import("lodash").CurriedFunction1<Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const defaultStatusCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const filterDataPublishedAtCurry: import("lodash").CurriedFunction1<Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const statusToLookupCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
declare const statusToDataCurry: import("lodash").CurriedFunction2<Struct.SingleTypeSchema | Struct.CollectionTypeSchema, Modules.Documents.Params.All, Modules.Documents.Params.All>;
export { setStatusToDraftCurry as setStatusToDraft, defaultToDraftCurry as defaultToDraft, defaultStatusCurry as defaultStatus, filterDataPublishedAtCurry as filterDataPublishedAt, statusToLookupCurry as statusToLookup, statusToDataCurry as statusToData, };
//# sourceMappingURL=draft-and-publish.d.ts.map