import type { Components, ContentTypes } from '../../../types';
import type { UID } from '@strapi/types';
declare const sortContentType: (types: ContentTypes) => {
    visible: boolean;
    name: UID.ContentType;
    title: string;
    plugin: string | undefined;
    uid: UID.ContentType;
    to: string;
    kind: import("@strapi/types/dist/struct").ContentTypeKind;
    restrictRelationsTo: import("@strapi/types/dist/schema/attribute").RelationKind.Any[] | null;
    status: import("../../../types").Status;
}[];
type TrackingEventProperties = {
    newContentTypes: number;
    editedContentTypes: number;
    deletedContentTypes: number;
    newComponents: number;
    editedComponents: number;
    deletedComponents: number;
    newFields: number;
    editedFields: number;
    deletedFields: number;
};
declare const stateToRequestData: ({ components, contentTypes, }: {
    components: Components;
    contentTypes: ContentTypes;
}) => {
    requestData: {
        components: ({
            action: string;
            uid: `${string}.${string}` | UID.ContentType;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            modelType?: "component" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            category: string | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").SchemaInfo | undefined;
            status?: import("../../../types").Status | undefined;
            action: string;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            singularName: string;
            pluralName: string;
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            modelType?: "component" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            category: string | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").SchemaInfo | undefined;
            status?: import("../../../types").Status | undefined;
            action: string;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            kind?: import("@strapi/types/dist/struct").ContentTypeKind | undefined;
            modelType?: "contentType" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").ContentTypeSchemaInfo | undefined;
            indexes?: unknown[] | undefined;
            foreignKeys?: unknown[] | undefined;
            visible?: boolean | undefined;
            status?: import("../../../types").Status | undefined;
            restrictRelationsTo?: import("@strapi/types/dist/schema/attribute").RelationKind.Any[] | null | undefined;
            action: string;
            category: string | undefined;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            singularName: string;
            pluralName: string;
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            kind?: import("@strapi/types/dist/struct").ContentTypeKind | undefined;
            modelType?: "contentType" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").ContentTypeSchemaInfo | undefined;
            indexes?: unknown[] | undefined;
            foreignKeys?: unknown[] | undefined;
            visible?: boolean | undefined;
            status?: import("../../../types").Status | undefined;
            restrictRelationsTo?: import("@strapi/types/dist/schema/attribute").RelationKind.Any[] | null | undefined;
            action: string;
            category: string | undefined;
        })[];
        contentTypes: ({
            action: string;
            uid: `${string}.${string}` | UID.ContentType;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            modelType?: "component" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            category: string | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").SchemaInfo | undefined;
            status?: import("../../../types").Status | undefined;
            action: string;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            singularName: string;
            pluralName: string;
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            modelType?: "component" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            category: string | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").SchemaInfo | undefined;
            status?: import("../../../types").Status | undefined;
            action: string;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            kind?: import("@strapi/types/dist/struct").ContentTypeKind | undefined;
            modelType?: "contentType" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").ContentTypeSchemaInfo | undefined;
            indexes?: unknown[] | undefined;
            foreignKeys?: unknown[] | undefined;
            visible?: boolean | undefined;
            status?: import("../../../types").Status | undefined;
            restrictRelationsTo?: import("@strapi/types/dist/schema/attribute").RelationKind.Any[] | null | undefined;
            action: string;
            category: string | undefined;
        } | {
            attributes: ({
                action: string;
                name: string;
                properties?: undefined;
            } | {
                action: string;
                name: string;
                properties: {
                    [k: string]: unknown;
                };
            })[];
            singularName: string;
            pluralName: string;
            displayName: string;
            description?: string | undefined;
            icon?: string | undefined;
            reviewWorkflows?: boolean | undefined;
            populateCreatorFields?: boolean | undefined;
            comment?: string | undefined;
            version?: string | undefined;
            draftAndPublish?: boolean | undefined;
            kind?: import("@strapi/types/dist/struct").ContentTypeKind | undefined;
            modelType?: "contentType" | undefined;
            uid: `${string}.${string}` | `admin::${string}` | `strapi::${string}`;
            options?: import("@strapi/types/dist/struct").SchemaOptions | undefined;
            modelName?: string | undefined;
            globalId?: string | undefined;
            pluginOptions?: import("@strapi/types/dist/struct").SchemaPluginOptions | undefined;
            collectionName?: string | undefined;
            plugin?: string | undefined;
            info?: import("@strapi/types/dist/struct").ContentTypeSchemaInfo | undefined;
            indexes?: unknown[] | undefined;
            foreignKeys?: unknown[] | undefined;
            visible?: boolean | undefined;
            status?: import("../../../types").Status | undefined;
            restrictRelationsTo?: import("@strapi/types/dist/schema/attribute").RelationKind.Any[] | null | undefined;
            action: string;
            category: string | undefined;
        })[];
    };
    trackingEventProperties: TrackingEventProperties;
};
export { stateToRequestData, sortContentType };
