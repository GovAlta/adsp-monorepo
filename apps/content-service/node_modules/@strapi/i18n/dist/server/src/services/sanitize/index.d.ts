/// <reference types="lodash" />
import type { Core, Data } from '@strapi/types';
declare const sanitize: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    sanitizeLocalizationFields: import("lodash").CurriedFunction2<import("@strapi/types/dist/struct").ContentTypeSchema | import("@strapi/types/dist/struct").ComponentSchema, Data.Entity<import("@strapi/types/dist/uid").Schema, string>, Promise<import("@strapi/utils/dist/types").Data>>;
};
type SanitizeService = typeof sanitize;
export default sanitize;
export type { SanitizeService };
//# sourceMappingURL=index.d.ts.map