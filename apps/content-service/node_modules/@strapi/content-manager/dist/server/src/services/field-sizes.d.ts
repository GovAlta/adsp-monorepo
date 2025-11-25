import type { Core, Modules } from '@strapi/types';
type FieldSize = Modules.CustomFields.CustomFieldServerOptions['inputSize'];
declare const createFieldSizesService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    getAllFieldSizes(): Record<string, {
        default: 8 | 6 | 4 | 12;
        isResizable: boolean;
    } | undefined>;
    hasFieldSize(type: string): boolean;
    getFieldSize(type?: string): {
        default: 8 | 6 | 4 | 12;
        isResizable: boolean;
    };
    setFieldSize(type: string, size: FieldSize): void;
    setCustomFieldInputSizes(): void;
};
export default createFieldSizesService;
//# sourceMappingURL=field-sizes.d.ts.map