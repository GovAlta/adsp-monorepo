/**
 * Creates a content type schema builder instance
 */
export default function createBuilder(): {
    /**
     * Write all type to files
     */
    writeFiles(): Promise<any[]>;
    /**
     * rollback all files
     */
    rollback(): Promise<any[]>;
    setRelation(this: any, { key, uid, attribute }: {
        key: string;
        uid: string;
        attribute: import("./types").InternalRelationAttribute;
    }): void;
    unsetRelation(this: any, attribute: import("@strapi/types/dist/schema/attribute").Relation<import("@strapi/types/dist/schema/attribute").RelationKind.Any, import("@strapi/types/dist/uid").ContentType>): any;
    createContentTypeAttributes(this: any, uid: string, attributes: import("@strapi/types/dist/struct").SchemaAttributes & Record<string, any>): any;
    createContentType(this: any, infos: import("../../controllers/validation/content-type").CreateContentTypeInput): {
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
    createComponentUID({ category, displayName }: any): string;
    createNewComponentUIDMap(components: object[]): any;
    createComponentAttributes(this: any, uid: string, attributes: any): any;
    createComponent(this: any, infos: any): {
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
    editComponent(this: any, infos: any): any;
    deleteComponent(this: any, uid: `${string}.${string}`): any;
    components: Map<any, any>;
    contentTypes: Map<any, any>;
    /**
     * Convert Attributes received from the API to the right syntax
     */
    convertAttributes(attributes: any): Record<string, unknown>;
    convertAttribute(attribute: any): any;
};
//# sourceMappingURL=index.d.ts.map