import type { Core, Struct } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    canConfigureContentType({ userAbility, contentType, }: {
        userAbility: any;
        contentType: Struct.ContentTypeSchema;
    }): any;
    registerPermissions(): Promise<void>;
};
export default _default;
//# sourceMappingURL=permission.d.ts.map