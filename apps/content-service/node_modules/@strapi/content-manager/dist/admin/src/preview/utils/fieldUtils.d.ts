import { type FieldContentSourceMap } from '@strapi/admin/strapi-admin';
import type { PREVIEW_ERROR_MESSAGES } from './constants';
import type { PreviewContextValue } from '../pages/Preview';
import type { Modules, Schema } from '@strapi/types';
type PreviewErrorMessage = keyof typeof PREVIEW_ERROR_MESSAGES;
export declare class PreviewFieldError extends Error {
    readonly messageKey: PreviewErrorMessage;
    constructor(messageKey: PreviewErrorMessage);
}
type PathPart = {
    name: string;
    index?: number;
};
export declare const parsePathWithIndices: (path: string) => PathPart[];
export declare function getAttributeSchemaFromPath({ path, schema, components, document, }: {
    path: string;
    schema: PreviewContextValue['schema'] | PreviewContextValue['components'][string];
    components: PreviewContextValue['components'];
    document: Modules.Documents.AnyDocument;
}): Schema.Attribute.AnyAttribute;
export declare function parseFieldMetaData(strapiSource: string): FieldContentSourceMap | null;
export {};
