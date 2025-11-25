import type { Modules, Schema } from '@strapi/types';
type EntriesUpdate = (entryToUpdate: any, param?: any) => Promise<any>;
type ParamsTransform = (params: Modules.Documents.Params.All) => Modules.Documents.Params.All;
declare const addFirstPublishedAtToDraft: (draft: any, update: EntriesUpdate, contentType: Schema.ContentType) => Promise<any>;
declare const filterDataFirstPublishedAt: ParamsTransform;
export { addFirstPublishedAtToDraft, filterDataFirstPublishedAt };
//# sourceMappingURL=first-published-at.d.ts.map