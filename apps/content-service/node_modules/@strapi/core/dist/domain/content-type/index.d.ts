import type { Schema } from '@strapi/types';
export type ContentTypeDefinition = {
    schema: Schema.ContentType;
    actions: Record<string, unknown>;
    lifecycles: Record<string, unknown>;
};
declare const createContentType: (uid: string, definition: ContentTypeDefinition) => import("@strapi/types/dist/struct").ContentTypeSchema;
declare const getGlobalId: (schema: Schema.ContentType, prefix?: string) => string;
export { createContentType, getGlobalId };
//# sourceMappingURL=index.d.ts.map