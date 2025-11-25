import { pipe, propOr, pick, isEqual, isEmpty } from 'lodash/fp';
import { traverse } from '@strapi/utils';
import qs from 'qs';
import { getSortableAttributes, getDefaultMainField, isSortable } from './attributes.mjs';

/** General settings */ const DEFAULT_SETTINGS = {
    bulkable: true,
    filterable: true,
    searchable: true,
    pageSize: 10
};
const settingsFields = [
    'searchable',
    'filterable',
    'bulkable',
    'pageSize',
    'mainField',
    'defaultSortBy',
    'defaultSortOrder'
];
const getModelSettings = pipe([
    propOr({}, 'config.settings'),
    pick(settingsFields)
]);
async function isValidDefaultSort(schema, value) {
    const parsedValue = qs.parse(value);
    const omitNonSortableAttributes = ({ schema, key }, { remove })=>{
        const sortableAttributes = getSortableAttributes(schema);
        if (!sortableAttributes.includes(key)) {
            remove(key);
        }
    };
    const sanitizedValue = await traverse.traverseQuerySort(omitNonSortableAttributes, {
        schema,
        getModel: strapi.getModel.bind(strapi)
    }, parsedValue);
    // If any of the keys has been removed, the sort attribute is not valid
    return isEqual(parsedValue, sanitizedValue);
}
const createDefaultSettings = async (schema)=>{
    const defaultField = getDefaultMainField(schema);
    return {
        ...DEFAULT_SETTINGS,
        mainField: defaultField,
        defaultSortBy: defaultField,
        defaultSortOrder: 'ASC',
        ...getModelSettings(schema)
    };
};
const syncSettings = async (configuration, schema)=>{
    if (isEmpty(configuration.settings)) return createDefaultSettings(schema);
    const defaultField = getDefaultMainField(schema);
    const { mainField = defaultField, defaultSortBy = defaultField } = configuration.settings || {};
    return {
        ...configuration.settings,
        mainField: isSortable(schema, mainField) ? mainField : defaultField,
        defaultSortBy: await isValidDefaultSort(schema, defaultSortBy) ? defaultSortBy : defaultField
    };
};

export { createDefaultSettings, isValidDefaultSort, syncSettings };
//# sourceMappingURL=settings.mjs.map
