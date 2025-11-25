import type { Schema } from '@strapi/types';
import { CreateContentTypeInput } from '../../controllers/validation/content-type';
import type { InternalRelationAttribute } from './types';
export default function createComponentBuilder(): {
    setRelation(this: any, { key, uid, attribute }: {
        key: string;
        uid: string;
        attribute: InternalRelationAttribute;
    }): void;
    unsetRelation(this: any, attribute: Schema.Attribute.Relation<Schema.Attribute.RelationKind.Any>): any;
    createContentTypeAttributes(this: any, uid: string, attributes: CreateContentTypeInput['attributes']): any;
    /**
     * Creates a content type in memory to be written to files later on
     */
    createContentType(this: any, infos: CreateContentTypeInput): {
        readonly modelName: string | undefined;
        readonly plugin: string | undefined;
        readonly category: string | undefined;
        readonly kind: import("@strapi/types/dist/struct").ContentTypeKind;
        readonly uid: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}` | undefined;
        readonly writable: boolean;
        setUID(val: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}`): any;
        setDir(val: string): any;
        readonly schema: import("@strapi/types/dist/struct").ContentTypeSchema;
        setSchema(val: import("@strapi/types/dist/struct").ContentTypeSchema): any;
        get(path: string[]): any;
        set(path: string | string[], val: unknown): any;
        unset(path: string[]): any;
        delete(): any;
        getAttribute(key: string): any;
        setAttribute(key: string, attribute: any): any;
        deleteAttribute(key: string): any;
        setAttributes(newAttributes: import("@strapi/types/dist/struct").SchemaAttributes): any;
        removeContentType(uid: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}`): any;
        removeComponent(uid: `${string}.${string}`): any;
        updateComponent(uid: `${string}.${string}`, newUID: `${string}.${string}`): any;
        flush(): Promise<void>;
        rollback(): Promise<void>;
    };
    editContentType(this: any, infos: any): any;
    deleteContentType(this: any, uid: string): any;
};
//# sourceMappingURL=content-type-builder.d.ts.map