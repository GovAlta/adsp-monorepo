'use strict';

var strapiUtils = require('@strapi/utils');
var index = require('../../utils/index.js');
var attributes = require('../../services/utils/configuration/attributes.js');
var settings = require('../../services/utils/configuration/settings.js');

/**
 * Creates the validation schema for content-type configurations
 */ var createModelConfigurationSchema = ((schema, opts = {})=>strapiUtils.yup.object().shape({
        settings: createSettingsSchema(schema).default(null).nullable(),
        metadatas: createMetadasSchema(schema).default(null).nullable(),
        layouts: createLayoutsSchema(schema, opts).default(null).nullable(),
        options: strapiUtils.yup.object().optional()
    }).noUnknown());
const createSettingsSchema = (schema)=>{
    const validAttributes = Object.keys(schema.attributes).filter((key)=>attributes.isListable(schema, key));
    return strapiUtils.yup.object().shape({
        bulkable: strapiUtils.yup.boolean().required(),
        filterable: strapiUtils.yup.boolean().required(),
        pageSize: strapiUtils.yup.number().integer().min(10).max(100).required(),
        searchable: strapiUtils.yup.boolean().required(),
        // should be reset when the type changes
        mainField: strapiUtils.yup.string().oneOf(validAttributes.concat('id')).default('id'),
        // should be reset when the type changes
        defaultSortBy: strapiUtils.yup.string().test('is-valid-sort-attribute', '${path} is not a valid sort attribute', async (value)=>settings.isValidDefaultSort(schema, value)).default('id'),
        defaultSortOrder: strapiUtils.yup.string().oneOf([
            'ASC',
            'DESC'
        ]).default('ASC')
    }).noUnknown();
};
const createMetadasSchema = (schema)=>{
    return strapiUtils.yup.object().shape(Object.keys(schema.attributes).reduce((acc, key)=>{
        acc[key] = strapiUtils.yup.object().shape({
            edit: strapiUtils.yup.object().shape({
                label: strapiUtils.yup.string(),
                description: strapiUtils.yup.string(),
                placeholder: strapiUtils.yup.string(),
                editable: strapiUtils.yup.boolean(),
                visible: strapiUtils.yup.boolean(),
                mainField: strapiUtils.yup.lazy((value)=>{
                    if (!value) {
                        return strapiUtils.yup.string();
                    }
                    const targetSchema = index.getService('content-types').findContentType(schema.attributes[key].targetModel);
                    if (!targetSchema) {
                        return strapiUtils.yup.string();
                    }
                    const validAttributes = Object.keys(targetSchema.attributes).filter((key)=>attributes.isListable(targetSchema, key));
                    return strapiUtils.yup.string().oneOf(validAttributes.concat('id')).default('id');
                })
            }).noUnknown().required(),
            list: strapiUtils.yup.object().shape({
                label: strapiUtils.yup.string(),
                searchable: strapiUtils.yup.boolean(),
                sortable: strapiUtils.yup.boolean()
            }).noUnknown().required()
        }).noUnknown();
        return acc;
    }, {}));
};
const createArrayTest = ({ allowUndefined = false } = {})=>({
        name: 'isArray',
        message: '${path} is required and must be an array',
        test: (val)=>allowUndefined === true && val === undefined ? true : Array.isArray(val)
    });
const createLayoutsSchema = (schema, opts = {})=>{
    const validAttributes = Object.keys(schema.attributes).filter((key)=>attributes.isListable(schema, key));
    const editAttributes = Object.keys(schema.attributes).filter((key)=>attributes.hasEditableAttribute(schema, key));
    return strapiUtils.yup.object().shape({
        edit: strapiUtils.yup.array().of(strapiUtils.yup.array().of(strapiUtils.yup.object().shape({
            name: strapiUtils.yup.string().oneOf(editAttributes).required(),
            size: strapiUtils.yup.number().integer().positive().required()
        }).noUnknown())).test(createArrayTest(opts)),
        list: strapiUtils.yup.array().of(strapiUtils.yup.string().oneOf(validAttributes)).test(createArrayTest(opts))
    });
};

module.exports = createModelConfigurationSchema;
//# sourceMappingURL=model-configuration.js.map
