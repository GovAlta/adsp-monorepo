import type { Internal } from '@strapi/types';
export default function createComponentBuilder(): {
    createComponentUID({ category, displayName }: any): string;
    createNewComponentUIDMap(components: object[]): any;
    createComponentAttributes(this: any, uid: string, attributes: any): any;
    /**
     * create a component in the tmpComponent map
     */
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
    /**
     * create a component in the tmpComponent map
     */
    editComponent(this: any, infos: any): any;
    deleteComponent(this: any, uid: Internal.UID.Component): any;
};
//# sourceMappingURL=component-builder.d.ts.map