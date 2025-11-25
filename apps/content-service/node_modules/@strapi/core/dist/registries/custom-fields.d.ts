import type { Core, Modules } from '@strapi/types';
declare const customFieldsRegistry: (strapi: Core.Strapi) => {
    getAll(): Record<string, unknown>;
    get(customField: string): {};
    add(customField: Modules.CustomFields.CustomFieldServerOptions | Modules.CustomFields.CustomFieldServerOptions[]): void;
};
export default customFieldsRegistry;
//# sourceMappingURL=custom-fields.d.ts.map