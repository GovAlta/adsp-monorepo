'use strict';

var ability = require('@casl/ability');
var extra = require('@casl/ability/extra');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var user = require('../../../domain/user.js');

const { ValidationError } = utils.errors;
const { throwPassword, throwDisallowedFields } = utils.validate.visitors;
const { constants, isScalarAttribute, getNonVisibleAttributes, getWritableAttributes } = utils.contentTypes;
const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE, CREATED_AT_ATTRIBUTE, UPDATED_AT_ATTRIBUTE, PUBLISHED_AT_ATTRIBUTE, CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = constants;
const COMPONENT_FIELDS = [
    '__component'
];
const STATIC_FIELDS = [
    ID_ATTRIBUTE,
    DOC_ID_ATTRIBUTE
];
const throwInvalidKey = ({ key, path })=>{
    const msg = path && path !== key ? `Invalid key ${key} at ${path}` : `Invalid key ${key}`;
    throw new ValidationError(msg);
};
var createValidateHelpers = (({ action, ability: ability$1, model })=>{
    const schema = strapi.getModel(model);
    const ctx = {
        schema,
        getModel: strapi.getModel.bind(strapi)
    };
    const createValidateQuery = (options = {})=>{
        const { fields } = options;
        // TODO: validate relations to admin users in all validators
        const permittedFields = fields.shouldIncludeAll ? null : getQueryFields(fields.permitted);
        const validateFilters = utils.async.pipe(utils.traverse.traverseQueryFilters(throwDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryFilters(throwDisallowedAdminUserFields, ctx), utils.traverse.traverseQueryFilters(throwPassword, ctx), utils.traverse.traverseQueryFilters(({ key, value, path })=>{
            if (fp.isObject(value) && fp.isEmpty(value)) {
                throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
        const validateSort = utils.async.pipe(utils.traverse.traverseQuerySort(throwDisallowedFields(permittedFields), ctx), utils.traverse.traverseQuerySort(throwDisallowedAdminUserFields, ctx), utils.traverse.traverseQuerySort(throwPassword, ctx), utils.traverse.traverseQuerySort(({ key, attribute, value, path })=>{
            if (!isScalarAttribute(attribute) && fp.isEmpty(value)) {
                throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
        const validateFields = utils.async.pipe(utils.traverse.traverseQueryFields(throwDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryFields(throwPassword, ctx));
        const validatePopulate = utils.async.pipe(utils.traverse.traverseQueryPopulate(throwDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryPopulate(throwDisallowedAdminUserFields, ctx), utils.traverse.traverseQueryPopulate(throwHiddenFields, ctx), utils.traverse.traverseQueryPopulate(throwPassword, ctx));
        return async (query)=>{
            if (query.filters) {
                await validateFilters(query.filters);
            }
            if (query.sort) {
                await validateSort(query.sort);
            }
            if (query.fields) {
                await validateFields(query.fields);
            }
            // a wildcard is always valid; its conversion will be handled by the entity service and can be optimized with sanitizer
            if (query.populate && query.populate !== '*') {
                await validatePopulate(query.populate);
            }
            return true;
        };
    };
    const createValidateInput = (options = {})=>{
        const { fields } = options;
        const permittedFields = fields.shouldIncludeAll ? null : getInputFields(fields.permitted);
        return utils.async.pipe(// Remove fields hidden from the admin
        utils.traverseEntity(throwHiddenFields, ctx), // Remove not allowed fields (RBAC)
        utils.traverseEntity(throwDisallowedFields(permittedFields), ctx), // Remove roles from createdBy & updatedBy fields
        omitCreatorRoles);
    };
    const wrapValidate = (createValidateFunction)=>{
        // TODO
        // @ts-expect-error define the correct return type
        const wrappedValidate = async (data, options = {})=>{
            if (fp.isArray(data)) {
                return Promise.all(data.map((entity)=>wrappedValidate(entity, options)));
            }
            const { subject, action: actionOverride } = getDefaultOptions(data, options);
            const permittedFields = extra.permittedFieldsOf(ability$1, actionOverride, subject, {
                fieldsFrom: (rule)=>rule.fields || []
            });
            const hasAtLeastOneRegistered = fp.some((fields)=>!fp.isNil(fields), fp.flatMap(fp.prop('fields'), ability$1.rulesFor(actionOverride, ability.detectSubjectType(subject))));
            const shouldIncludeAllFields = fp.isEmpty(permittedFields) && !hasAtLeastOneRegistered;
            const validateOptions = {
                ...options,
                fields: {
                    shouldIncludeAll: shouldIncludeAllFields,
                    permitted: permittedFields,
                    hasAtLeastOneRegistered
                }
            };
            const validateFunction = createValidateFunction(validateOptions);
            return validateFunction(data);
        };
        return wrappedValidate;
    };
    const getDefaultOptions = (data, options)=>{
        return fp.defaults({
            subject: ability.subject(model, data),
            action
        }, options);
    };
    /**
   * Omit creator fields' (createdBy & updatedBy) roles from the admin API responses
   */ const omitCreatorRoles = fp.omit([
        `${CREATED_BY_ATTRIBUTE}.roles`,
        `${UPDATED_BY_ATTRIBUTE}.roles`
    ]);
    /**
   * Visitor used to remove hidden fields from the admin API responses
   */ const throwHiddenFields = ({ key, schema, path })=>{
        const isHidden = fp.getOr(false, [
            'config',
            'attributes',
            key,
            'hidden'
        ], schema);
        if (isHidden) {
            throwInvalidKey({
                key,
                path: path.attribute
            });
        }
    };
    /**
   * Visitor used to omit disallowed fields from the admin users entities & avoid leaking sensitive information
   */ const throwDisallowedAdminUserFields = ({ key, attribute, schema, path })=>{
        if (schema.uid === 'admin::user' && attribute && !user.ADMIN_USER_ALLOWED_FIELDS.includes(key)) {
            throwInvalidKey({
                key,
                path: path.attribute
            });
        }
    };
    const getInputFields = (fields = [])=>{
        const nonVisibleAttributes = getNonVisibleAttributes(schema);
        const writableAttributes = getWritableAttributes(schema);
        const nonVisibleWritableAttributes = fp.intersection(nonVisibleAttributes, writableAttributes);
        return fp.uniq([
            ...fields,
            ...COMPONENT_FIELDS,
            ...nonVisibleWritableAttributes
        ]);
    };
    const getQueryFields = (fields = [])=>{
        return fp.uniq([
            ...fields,
            ...STATIC_FIELDS,
            ...COMPONENT_FIELDS,
            CREATED_AT_ATTRIBUTE,
            UPDATED_AT_ATTRIBUTE,
            PUBLISHED_AT_ATTRIBUTE
        ]);
    };
    return {
        validateQuery: wrapValidate(createValidateQuery),
        validateInput: wrapValidate(createValidateInput)
    };
});

module.exports = createValidateHelpers;
//# sourceMappingURL=validate.js.map
