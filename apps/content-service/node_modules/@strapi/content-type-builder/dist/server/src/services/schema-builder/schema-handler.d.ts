import type { Internal, Struct } from '@strapi/types';
export type Infos = {
    category?: string;
    modelName?: string;
    plugin?: string;
    uid?: Internal.UID.ContentType;
    dir: string;
    filename: string;
    schema?: Struct.ContentTypeSchema;
};
export default function createSchemaHandler(infos: Infos): {
    readonly modelName: string | undefined;
    readonly plugin: string | undefined;
    readonly category: string | undefined;
    readonly kind: Struct.ContentTypeKind;
    readonly uid: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}` | undefined;
    readonly writable: boolean;
    setUID(val: Internal.UID.ContentType): any;
    setDir(val: string): any;
    readonly schema: Struct.ContentTypeSchema;
    setSchema(val: Struct.ContentTypeSchema): any;
    get(path: string[]): any;
    set(path: string[] | string, val: unknown): any;
    unset(path: string[]): any;
    delete(): any;
    getAttribute(key: string): any;
    setAttribute(key: string, attribute: any): any;
    deleteAttribute(key: string): any;
    setAttributes(newAttributes: Struct.SchemaAttributes): any;
    removeContentType(uid: Internal.UID.ContentType): any;
    removeComponent(uid: Internal.UID.Component): any;
    updateComponent(uid: Internal.UID.Component, newUID: Internal.UID.Component): any;
    flush(): Promise<void>;
    rollback(): Promise<void>;
};
//# sourceMappingURL=schema-handler.d.ts.map