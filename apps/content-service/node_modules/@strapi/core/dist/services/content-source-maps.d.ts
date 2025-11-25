import type { Core, Struct } from '@strapi/types';
import type { FieldContentSourceMap } from '@strapi/admin/strapi-admin';
interface EncodingInfo {
    data: any;
    schema: Struct.Schema;
}
declare const createContentSourceMapsService: (strapi: Core.Strapi) => {
    encodeField(text: string, { kind, model, documentId, type, path, locale }: FieldContentSourceMap): string;
    encodeEntry({ data, schema }: EncodingInfo): Promise<any>;
    encodeSourceMaps({ data, schema }: EncodingInfo): Promise<any>;
};
export { createContentSourceMapsService };
//# sourceMappingURL=content-source-maps.d.ts.map