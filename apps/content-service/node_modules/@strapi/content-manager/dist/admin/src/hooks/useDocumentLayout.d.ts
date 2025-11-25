import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryError } from '../utils/api';
import { type ComponentsDictionary, type Document, type Schema } from './useDocument';
import type { ComponentConfiguration } from '../../../shared/contracts/components';
import type { Metadatas, FindContentTypeConfiguration, Settings } from '../../../shared/contracts/content-types';
import type { Filters, InputProps, Table } from '@strapi/admin/strapi-admin';
import type { Schema as SchemaUtils } from '@strapi/types';
type LayoutOptions = Schema['options'] & Schema['pluginOptions'] & object;
interface LayoutSettings extends Settings {
    displayName?: string;
    icon?: never;
}
interface ListFieldLayout extends Table.Header<Document, ListFieldLayout>, Pick<Filters.Filter, 'mainField'> {
    attribute: SchemaUtils.Attribute.AnyAttribute | {
        type: 'custom';
    };
}
interface ListLayout {
    layout: ListFieldLayout[];
    components?: never;
    metadatas: {
        [K in keyof Metadatas]: Metadatas[K]['list'];
    };
    options: LayoutOptions;
    settings: LayoutSettings;
}
interface EditFieldSharedProps extends Omit<InputProps, 'hint' | 'label' | 'type'>, Pick<Filters.Filter, 'mainField'> {
    hint?: string;
    label: string;
    size: number;
    unique?: boolean;
    visible?: boolean;
}
/**
 * Map over all the types in Attribute Types and use that to create a union of new types where the attribute type
 * is under the property attribute and the type is under the property type.
 */
type EditFieldLayout = {
    [K in SchemaUtils.Attribute.Kind]: EditFieldSharedProps & {
        attribute: Extract<SchemaUtils.Attribute.AnyAttribute, {
            type: K;
        }>;
        type: K;
    };
}[SchemaUtils.Attribute.Kind];
interface EditLayout {
    layout: Array<Array<EditFieldLayout[]>>;
    components: {
        [uid: string]: {
            layout: Array<EditFieldLayout[]>;
            settings: ComponentConfiguration['settings'] & {
                displayName?: string;
                icon?: string;
            };
        };
    };
    metadatas: {
        [K in keyof Metadatas]: Metadatas[K]['edit'];
    };
    options: LayoutOptions;
    settings: LayoutSettings;
}
type UseDocumentLayout = (model: string) => {
    error?: BaseQueryError | SerializedError;
    isLoading: boolean;
    /**
     * This is the layout for the edit view,
     */
    edit: EditLayout;
    list: ListLayout;
};
declare const DEFAULT_SETTINGS: {
    bulkable: boolean;
    filterable: boolean;
    searchable: boolean;
    pagination: boolean;
    defaultSortBy: string;
    defaultSortOrder: string;
    mainField: string;
    pageSize: number;
};
/**
 * @alpha
 * @description This hook is used to get the layouts for either the edit view or list view of a specific content-type
 * including the layouts for the components used in the content-type. It also runs the mutation hook waterfall so the data
 * is consistent wherever it is used. It's a light wrapper around the `useDocument` hook, but provides the `skip` option a document
 * is not fetched, however, it does fetch the schemas & components if they do not already exist in the cache.
 *
 * If the fetch fails, it will display a notification to the user.
 *
 * @example
 * ```tsx
 * const { model } = useParams<{ model: string }>();
 * const { edit: { schema: layout } } = useDocumentLayout(model);
 *
 * return layout.map(panel => panel.map(row => row.map(field => <Field.Root {...field} />)))
 * ```
 *
 */
declare const useDocumentLayout: UseDocumentLayout;
/**
 * @internal this hook uses the internal useDoc hook, as such it shouldn't be used outside of the
 * content-manager because it won't work as intended.
 */
declare const useDocLayout: () => {
    error?: SerializedError | BaseQueryError | undefined;
    isLoading: boolean;
    /**
     * This is the layout for the edit view,
     */
    edit: EditLayout;
    list: ListLayout;
};
type LayoutData = FindContentTypeConfiguration.Response['data'];
/**
 * @internal
 * @description takes the edit layout from either a content-type or a component
 * and formats it into a generic object that can be used to correctly render
 * the form fields.
 */
declare const convertEditLayoutToFieldLayouts: (rows: LayoutData['contentType']['layouts']['edit'], attributes: import("@strapi/types/dist/struct").SchemaAttributes | undefined, metadatas: Metadatas, components?: {
    configurations: Record<string, ComponentConfiguration>;
    schemas: ComponentsDictionary;
}, schemas?: Schema[]) => EditFieldLayout[][];
/**
 * @internal
 * @description takes the columns from the list view configuration and formats them into a generic object
 * combinining metadata and attribute data.
 *
 * @note We do use this to reformat the list of strings when updating the displayed headers for the list view.
 */
declare const convertListLayoutToFieldLayouts: (columns: LayoutData['contentType']['layouts']['list'], attributes: import("@strapi/types/dist/struct").SchemaAttributes | undefined, metadatas: ListLayout['metadatas'], components?: {
    configurations: Record<string, ComponentConfiguration>;
    schemas: ComponentsDictionary;
}, schemas?: Schema[]) => ListFieldLayout[];
export { useDocLayout, useDocumentLayout, convertListLayoutToFieldLayouts, convertEditLayoutToFieldLayouts, DEFAULT_SETTINGS, };
export type { EditLayout, EditFieldLayout, ListLayout, ListFieldLayout, UseDocumentLayout };
