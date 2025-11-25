import type { AnyAttribute, ContentType } from '../../../types';
import type { Internal, Struct } from '@strapi/types';
export type EditableContentTypeSchema = {
    kind: Struct.ContentTypeKind;
    name: string;
    attributes: AnyAttribute[];
};
export type EditableContentTypeData = {
    contentType: {
        uid: Internal.UID.ContentType;
        schema: EditableContentTypeSchema;
    };
};
type ModifiedData = {
    kind?: Struct.ContentTypeKind;
};
export declare const canEditContentType: (type: ContentType, modifiedData: ModifiedData) => boolean;
export {};
