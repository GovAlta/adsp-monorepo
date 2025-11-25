import type { Core, UID } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    generateUIDField({ contentTypeUID, field, data, locale, }: {
        contentTypeUID: UID.ContentType;
        field: string;
        data: Record<string, any>;
        locale?: string;
    }): Promise<string>;
    findUniqueUID({ contentTypeUID, field, value, locale, }: {
        contentTypeUID: UID.ContentType;
        field: string;
        value: string;
        locale?: string;
    }): Promise<string>;
    checkUIDAvailability({ contentTypeUID, field, value, locale, }: {
        contentTypeUID: UID.ContentType;
        field: string;
        value: string;
        locale?: string;
    }): Promise<boolean>;
};
export default _default;
//# sourceMappingURL=uid.d.ts.map