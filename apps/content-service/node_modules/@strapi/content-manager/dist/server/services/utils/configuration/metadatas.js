'use strict';

var _ = require('lodash');
var index = require('../../../utils/index.js');
var attributes = require('./attributes.js');

function createDefaultMetadatas(schema) {
    return {
        ...Object.keys(schema.attributes).reduce((acc, name)=>{
            acc[name] = createDefaultMetadata(schema, name);
            return acc;
        }, {}),
        id: {
            edit: {},
            list: {
                label: 'id',
                searchable: true,
                sortable: true
            }
        },
        documentId: {
            edit: {},
            list: {
                label: 'documentId',
                searchable: true,
                sortable: true
            }
        }
    };
}
function createDefaultMetadata(schema, name) {
    const edit = {
        label: name,
        description: '',
        placeholder: '',
        visible: attributes.isVisible(schema, name),
        editable: true
    };
    const fieldAttributes = schema.attributes[name];
    if (attributes.isRelation(fieldAttributes)) {
        const { targetModel } = fieldAttributes;
        const targetSchema = getTargetSchema(targetModel);
        if (targetSchema) {
            edit.mainField = attributes.getDefaultMainField(targetSchema);
        }
    }
    _.assign(edit, _.pick(_.get(schema, [
        'config',
        'metadatas',
        name,
        'edit'
    ], {}), [
        'label',
        'description',
        'placeholder',
        'visible',
        'editable',
        'mainField'
    ]));
    const list = {
        // @ts-expect-error we need to specify these properties
        label: name,
        // @ts-expect-error we need to specify these properties
        searchable: attributes.isSearchable(schema, name),
        // @ts-expect-error we need to specify these properties
        sortable: attributes.isSortable(schema, name),
        ..._.pick(_.get(schema, [
            'config',
            'metadatas',
            name,
            'list'
        ], {}), [
            'label',
            'searchable',
            'sortable'
        ])
    };
    return {
        edit,
        list
    };
}
/** Synchronisation functions */ async function syncMetadatas(configuration, schema) {
    // clear all keys that do not exist anymore
    if (_.isEmpty(configuration.metadatas)) {
        return createDefaultMetadatas(schema);
    }
    // remove old keys
    const metasWithValidKeys = _.pick(configuration.metadatas, Object.keys(schema.attributes));
    // add new keys and missing fields
    const metasWithDefaults = _.merge({}, createDefaultMetadatas(schema), metasWithValidKeys);
    // clear the invalid mainFields
    const updatedMetas = Object.keys(metasWithDefaults).reduce((acc, key)=>{
        const { edit, list } = metasWithDefaults[key];
        const attr = schema.attributes[key];
        const updatedMeta = {
            edit,
            list
        };
        // update sortable attr
        if (list.sortable && !attributes.isSortable(schema, key)) {
            _.set(updatedMeta, [
                'list',
                'sortable'
            ], false);
            _.set(acc, [
                key
            ], updatedMeta);
        }
        if (list.searchable && !attributes.isSearchable(schema, key)) {
            _.set(updatedMeta, [
                'list',
                'searchable'
            ], false);
            _.set(acc, [
                key
            ], updatedMeta);
        }
        if (!_.has(edit, 'mainField')) return acc;
        // remove mainField if the attribute is not a relation anymore
        if (!attributes.isRelation(attr)) {
            _.set(updatedMeta, 'edit', _.omit(edit, [
                'mainField'
            ]));
            _.set(acc, [
                key
            ], updatedMeta);
            return acc;
        }
        // if the mainField is id you can keep it
        if (edit.mainField === 'id') return acc;
        // check the mainField in the targetModel
        const targetSchema = getTargetSchema(attr.targetModel);
        if (!targetSchema) return acc;
        if (!attributes.isSortable(targetSchema, edit.mainField) && !attributes.isListable(targetSchema, edit.mainField)) {
            _.set(updatedMeta, [
                'edit',
                'mainField'
            ], attributes.getDefaultMainField(targetSchema));
            _.set(acc, [
                key
            ], updatedMeta);
            return acc;
        }
        return acc;
    }, {});
    return _.assign(metasWithDefaults, updatedMetas);
}
const getTargetSchema = (targetModel)=>{
    return index.getService('content-types').findContentType(targetModel);
};

exports.createDefaultMetadatas = createDefaultMetadatas;
exports.syncMetadatas = syncMetadatas;
//# sourceMappingURL=metadatas.js.map
