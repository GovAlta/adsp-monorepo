import type { Internal, Struct } from '@strapi/types';
/**
 * Formats a component attributes
 */
export declare const formatComponent: (component: any) => {
    uid: any;
    category: any;
    apiId: any;
    schema: {
        displayName: any;
        description: any;
        icon: any;
        connection: any;
        collectionName: any;
        pluginOptions: any;
        attributes: any;
    };
};
/**
 * Creates a component and handle the nested components sent with it
 */
export declare const createComponent: ({ component, components }: any) => Promise<{
    readonly modelName: string | undefined;
    readonly plugin: string | undefined;
    readonly category: string | undefined;
    readonly kind: Struct.ContentTypeKind;
    readonly uid: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}` | undefined;
    readonly writable: boolean;
    setUID(val: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}`): any;
    setDir(val: string): any;
    readonly schema: Struct.ContentTypeSchema;
    setSchema(val: Struct.ContentTypeSchema): any;
    get(path: string[]): any;
    set(path: string | string[], val: unknown): any;
    unset(path: string[]): any;
    delete(): any;
    getAttribute(key: string): any;
    setAttribute(key: string, attribute: any): any;
    deleteAttribute(key: string): any;
    setAttributes(newAttributes: Struct.SchemaAttributes): any;
    removeContentType(uid: `admin::${string}` | `api::${string}.${string}` | `plugin::${string}.${string}` | `strapi::${string}`): any;
    removeComponent(uid: `${string}.${string}`): any;
    updateComponent(uid: `${string}.${string}`, newUID: `${string}.${string}`): any;
    flush(): Promise<void>;
    rollback(): Promise<void>;
}>;
type ComponentToCreate = {
    component: Struct.ComponentSchema;
    components?: Struct.ComponentSchema[];
};
export declare const editComponent: (uid: Internal.UID.Component, { component, components }: ComponentToCreate) => Promise<any>;
export declare const deleteComponent: (uid: Internal.UID.Component) => Promise<any>;
export {};
//# sourceMappingURL=components.d.ts.map