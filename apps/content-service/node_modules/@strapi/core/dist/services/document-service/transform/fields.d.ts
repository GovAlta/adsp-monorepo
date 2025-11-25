import type { Modules, UID } from '@strapi/types';
type Fields = Modules.Documents.Params.Pick<UID.Schema, 'fields'>['fields'];
export declare const transformFields: (fields: Fields) => Fields;
export {};
//# sourceMappingURL=fields.d.ts.map