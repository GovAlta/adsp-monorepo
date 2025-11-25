import * as React from 'react';
import { useQueryParams, useStrapiApp, useNotification, useAPIErrorHandler } from '@strapi/admin/strapi-admin';
import { HOOKS } from '../constants/hooks.mjs';
import { useGetContentTypeConfigurationQuery } from '../services/contentTypes.mjs';
import { getMainField } from '../utils/attributes.mjs';
import { useContentTypeSchema } from './useContentTypeSchema.mjs';
import { useDocument, useDoc } from './useDocument.mjs';

/* -------------------------------------------------------------------------------------------------
 * useDocumentLayout
 * -----------------------------------------------------------------------------------------------*/ const DEFAULT_SETTINGS = {
    bulkable: false,
    filterable: false,
    searchable: false,
    pagination: false,
    defaultSortBy: '',
    defaultSortOrder: 'asc',
    mainField: 'id',
    pageSize: 10
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
 */ const useDocumentLayout = (model)=>{
    const { schema, components } = useDocument({
        model,
        collectionType: ''
    }, {
        skip: true
    });
    const [{ query }] = useQueryParams();
    const runHookWaterfall = useStrapiApp('useDocumentLayout', (state)=>state.runHookWaterfall);
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { isLoading: isLoadingSchemas, schemas } = useContentTypeSchema();
    const { data, isLoading: isLoadingConfigs, error, isFetching: isFetchingConfigs } = useGetContentTypeConfigurationQuery(model);
    const isLoading = isLoadingSchemas || isFetchingConfigs || isLoadingConfigs;
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    const editLayout = React.useMemo(()=>data && !isLoading ? formatEditLayout(data, {
            schemas,
            schema,
            components
        }) : {
            layout: [],
            components: {},
            metadatas: {},
            options: {},
            settings: DEFAULT_SETTINGS
        }, [
        data,
        isLoading,
        schemas,
        schema,
        components
    ]);
    const listLayout = React.useMemo(()=>{
        return data && !isLoading ? formatListLayout(data, {
            schemas,
            schema,
            components
        }) : {
            layout: [],
            metadatas: {},
            options: {},
            settings: DEFAULT_SETTINGS
        };
    }, [
        data,
        isLoading,
        schemas,
        schema,
        components
    ]);
    const { layout: edit } = React.useMemo(()=>runHookWaterfall(HOOKS.MUTATE_EDIT_VIEW_LAYOUT, {
            layout: editLayout,
            query
        }), [
        editLayout,
        query,
        runHookWaterfall
    ]);
    return {
        error,
        isLoading,
        edit,
        list: listLayout
    };
};
/* -------------------------------------------------------------------------------------------------
 * useDocLayout
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal this hook uses the internal useDoc hook, as such it shouldn't be used outside of the
 * content-manager because it won't work as intended.
 */ const useDocLayout = ()=>{
    const { model } = useDoc();
    return useDocumentLayout(model);
};
/**
 * @internal
 * @description takes the configuration data, the schema & the components used in the schema and formats the edit view
 * versions of the schema & components. This is then used to render the edit view of the content-type.
 */ const formatEditLayout = (data, { schemas, schema, components })=>{
    let currentPanelIndex = 0;
    /**
   * The fields arranged by the panels, new panels are made for dynamic zones only.
   */ const panelledEditAttributes = convertEditLayoutToFieldLayouts(data.contentType.layouts.edit, schema?.attributes, data.contentType.metadatas, {
        configurations: data.components,
        schemas: components
    }, schemas).reduce((panels, row)=>{
        if (row.some((field)=>field.type === 'dynamiczone')) {
            panels.push([
                row
            ]);
            currentPanelIndex += 2;
        } else {
            if (!panels[currentPanelIndex]) {
                panels.push([
                    row
                ]);
            } else {
                panels[currentPanelIndex].push(row);
            }
        }
        return panels;
    }, []);
    const componentEditAttributes = Object.entries(data.components).reduce((acc, [uid, configuration])=>{
        acc[uid] = {
            layout: convertEditLayoutToFieldLayouts(configuration.layouts.edit, components[uid].attributes, configuration.metadatas, {
                configurations: data.components,
                schemas: components
            }),
            settings: {
                ...configuration.settings,
                icon: components[uid].info.icon,
                displayName: components[uid].info.displayName
            }
        };
        return acc;
    }, {});
    const editMetadatas = Object.entries(data.contentType.metadatas).reduce((acc, [attribute, metadata])=>{
        return {
            ...acc,
            [attribute]: metadata.edit
        };
    }, {});
    return {
        layout: panelledEditAttributes,
        components: componentEditAttributes,
        metadatas: editMetadatas,
        settings: {
            ...data.contentType.settings,
            displayName: schema?.info.displayName
        },
        options: {
            ...schema?.options,
            ...schema?.pluginOptions,
            ...data.contentType.options
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * convertEditLayoutToFieldLayouts
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description takes the edit layout from either a content-type or a component
 * and formats it into a generic object that can be used to correctly render
 * the form fields.
 */ const convertEditLayoutToFieldLayouts = (rows, attributes = {}, metadatas, components, schemas = [])=>{
    return rows.map((row)=>row.map((field)=>{
            const attribute = attributes[field.name];
            if (!attribute) {
                return null;
            }
            const { edit: metadata } = metadatas[field.name];
            const settings = attribute.type === 'component' && components ? components.configurations[attribute.component].settings : {};
            return {
                attribute,
                disabled: !metadata.editable,
                hint: metadata.description,
                label: metadata.label ?? '',
                name: field.name,
                // @ts-expect-error – mainField does exist on the metadata for a relation.
                mainField: getMainField(attribute, metadata.mainField || settings.mainField, {
                    schemas,
                    components: components?.schemas ?? {}
                }),
                placeholder: metadata.placeholder ?? '',
                required: attribute.required ?? false,
                size: field.size,
                unique: 'unique' in attribute ? attribute.unique : false,
                visible: metadata.visible ?? true,
                type: attribute.type
            };
        }).filter((field)=>field !== null));
};
/* -------------------------------------------------------------------------------------------------
 * formatListLayout
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description takes the complete configuration data, the schema & the components used in the schema and
 * formats a list view layout for the content-type. This is much simpler than the edit view layout as there
 * are less options to consider.
 */ const formatListLayout = (data, { schemas, schema, components })=>{
    const listMetadatas = Object.entries(data.contentType.metadatas).reduce((acc, [attribute, metadata])=>{
        return {
            ...acc,
            [attribute]: metadata.list
        };
    }, {});
    /**
   * The fields arranged by the panels, new panels are made for dynamic zones only.
   */ const listAttributes = convertListLayoutToFieldLayouts(data.contentType.layouts.list, schema?.attributes, listMetadatas, {
        configurations: data.components,
        schemas: components
    }, schemas);
    return {
        layout: listAttributes,
        settings: {
            ...data.contentType.settings,
            displayName: schema?.info.displayName
        },
        metadatas: listMetadatas,
        options: {
            ...schema?.options,
            ...schema?.pluginOptions,
            ...data.contentType.options
        }
    };
};
/* -------------------------------------------------------------------------------------------------
 * convertListLayoutToFieldLayouts
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description takes the columns from the list view configuration and formats them into a generic object
 * combinining metadata and attribute data.
 *
 * @note We do use this to reformat the list of strings when updating the displayed headers for the list view.
 */ const convertListLayoutToFieldLayouts = (columns, attributes = {}, metadatas, components, schemas = [])=>{
    return columns.map((name)=>{
        const attribute = attributes[name];
        if (!attribute) {
            return null;
        }
        const metadata = metadatas[name];
        const settings = attribute.type === 'component' && components ? components.configurations[attribute.component].settings : {};
        return {
            attribute,
            label: metadata.label ?? '',
            mainField: getMainField(attribute, metadata.mainField || settings.mainField, {
                schemas,
                components: components?.schemas ?? {}
            }),
            name: name,
            searchable: metadata.searchable ?? true,
            sortable: metadata.sortable ?? true
        };
    }).filter((field)=>field !== null);
};

export { DEFAULT_SETTINGS, convertEditLayoutToFieldLayouts, convertListLayoutToFieldLayouts, useDocLayout, useDocumentLayout };
//# sourceMappingURL=useDocumentLayout.mjs.map
