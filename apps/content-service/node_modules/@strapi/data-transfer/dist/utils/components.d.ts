import type { Modules, UID, Data, Schema, Core } from '@strapi/types';
type LoadedComponents<TUID extends UID.Schema> = Data.Entity<TUID, Schema.AttributeNamesByType<TUID, 'component' | 'dynamiczone'>>;
type ComponentBody = {
    [key: string]: Schema.Attribute.Value<Schema.Attribute.Component<UID.Component, false> | Schema.Attribute.Component<UID.Component, true> | Schema.Attribute.DynamicZone>;
};
declare function omitComponentData(contentType: Schema.ContentType, data: Modules.EntityService.Params.Data.Input<Schema.ContentType['uid']>): Partial<Modules.EntityService.Params.Data.Input<Schema.ContentType['uid']>>;
declare function omitComponentData(contentType: Schema.Component, data: Modules.EntityService.Params.Data.Input<Schema.Component['uid']>): Partial<Modules.EntityService.Params.Data.Input<Schema.Component['uid']>>;
declare const createComponents: <TUID extends UID.Schema, TData extends Modules.EntityService.Params.Data.Input<TUID>>(uid: TUID, data: TData) => Promise<ComponentBody>;
declare const getComponents: <TUID extends UID.Schema>(uid: TUID, entity: {
    id: Modules.EntityService.Params.Attribute.ID;
}) => Promise<LoadedComponents<TUID>>;
declare const updateComponents: <TUID extends UID.Schema, TData extends Partial<Modules.EntityService.Params.Data.Input<TUID>>>(uid: TUID, entityToUpdate: {
    id: Modules.EntityService.Params.Attribute.ID;
}, data: TData) => Promise<ComponentBody>;
declare const deleteComponents: <TUID extends UID.Schema, TEntity extends Data.Entity<TUID, Extract<keyof Schema.Attributes<TUID>, string>>>(uid: TUID, entityToDelete: TEntity, { loadComponents }?: {
    loadComponents?: boolean | undefined;
}) => Promise<void>;
declare const deleteComponent: <TUID extends `${string}.${string}`>(uid: TUID, componentToDelete: Data.Component<TUID>) => Promise<void>;
/**
 * Resolve the component UID of an entity's attribute based
 * on a given path (components & dynamic zones only)
 */
declare const resolveComponentUID: ({ paths, strapi, data, contentType, }: {
    paths: string[];
    strapi: Core.Strapi;
    data: any;
    contentType: Schema.ContentType;
}) => UID.Schema | undefined;
export { omitComponentData, getComponents, createComponents, updateComponents, deleteComponents, deleteComponent, resolveComponentUID, };
//# sourceMappingURL=components.d.ts.map