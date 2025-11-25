'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var qs = require('qs');
var attributes = require('./attributes.js');

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
const getModelSettings = fp.pipe([
    fp.propOr({}, 'config.settings'),
    fp.pick(settingsFields)
]);
async function isValidDefaultSort(schema, value) {
    const parsedValue = qs.parse(value);
    const omitNonSortableAttributes = ({ schema, key }, { remove })=>{
        const sortableAttributes = attributes.getSortableAttributes(schema);
        if (!sortableAttributes.includes(key)) {
            remove(key);
        }
    };
    const sanitizedValue = await strapiUtils.traverse.traverseQuerySort(omitNonSortableAttributes, {
        schema,
        getModel: strapi.getModel.bind(strapi)
    }, parsedValue);
    // If any of the keys has been removed, the sort attribute is not valid
    return fp.isEqual(parsedValue, sanitizedValue);
}
const createDefaultSettings = async (schema)=>{
    const defaultField = attributes.getDefaultMainField(schema);
    return {
        ...DEFAULT_SETTINGS,
        mainField: defaultField,
        defaultSortBy: defaultField,
        defaultSortOrder: 'ASC',
        ...getModelSettings(schema)
    };
};
const syncSettings = async (configuration, schema)=>{
    if (fp.isEmpty(configuration.settings)) return createDefaultSettings(schema);
    const defaultField = attributes.getDefaultMainField(schema);
    const { mainField = defaultField, defaultSortBy = defaultField } = configuration.settings || {};
    return {
        ...configuration.settings,
        mainField: attributes.isSortable(schema, mainField) ? mainField : defaultField,
        defaultSortBy: await isValidDefaultSort(schema, defaultSortBy) ? defaultSortBy : defaultField
    };
};

exports.createDefaultSettings = createDefaultSettings;
exports.isValidDefaultSort = isValidDefaultSort;
exports.syncSettings = syncSettings;
//# sourceMappingURL=settings.js.map
