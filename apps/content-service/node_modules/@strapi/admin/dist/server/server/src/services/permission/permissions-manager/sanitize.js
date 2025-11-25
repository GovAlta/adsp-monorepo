'use strict';

var ability = require('@casl/ability');
var extra = require('@casl/ability/extra');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var user = require('../../../domain/user.js');

const { visitors: { removePassword, expandWildcardPopulate } } = utils.sanitize;
const { constants, isScalarAttribute, getNonVisibleAttributes, getNonWritableAttributes, getWritableAttributes } = utils.contentTypes;
const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE, CREATED_AT_ATTRIBUTE, UPDATED_AT_ATTRIBUTE, PUBLISHED_AT_ATTRIBUTE, CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = constants;
const COMPONENT_FIELDS = [
    '__component'
];
const STATIC_FIELDS = [
    ID_ATTRIBUTE,
    DOC_ID_ATTRIBUTE
];
var createSanitizeHelpers = (({ action, ability: ability$1, model })=>{
    const schema = strapi.getModel(model);
    const { removeDisallowedFields } = utils.sanitize.visitors;
    const ctx = {
        schema,
        getModel: strapi.getModel.bind(strapi)
    };
    const createSanitizeQuery = (options = {})=>{
        const { fields } = options;
        // TODO: sanitize relations to admin users in all sanitizers
        const permittedFields = fields.shouldIncludeAll ? null : getQueryFields(fields.permitted);
        const sanitizeFilters = utils.async.pipe(utils.traverse.traverseQueryFilters(removeDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryFilters(omitDisallowedAdminUserFields, ctx), utils.traverse.traverseQueryFilters(omitHiddenFields, ctx), utils.traverse.traverseQueryFilters(removePassword, ctx), utils.traverse.traverseQueryFilters(({ key, value }, { remove })=>{
            if (fp.isObject(value) && fp.isEmpty(value)) {
                remove(key);
            }
        }, ctx));
        const sanitizeSort = utils.async.pipe(utils.traverse.traverseQuerySort(removeDisallowedFields(permittedFields), ctx), utils.traverse.traverseQuerySort(omitDisallowedAdminUserFields, ctx), utils.traverse.traverseQuerySort(omitHiddenFields, ctx), utils.traverse.traverseQuerySort(removePassword, ctx), utils.traverse.traverseQuerySort(({ key, attribute, value }, { remove })=>{
            if (!isScalarAttribute(attribute) && fp.isEmpty(value)) {
                remove(key);
            }
        }, ctx));
        const sanitizePopulate = utils.async.pipe(utils.traverse.traverseQueryPopulate(expandWildcardPopulate, ctx), utils.traverse.traverseQueryPopulate(removeDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryPopulate(omitDisallowedAdminUserFields, ctx), utils.traverse.traverseQueryPopulate(omitHiddenFields, ctx), utils.traverse.traverseQueryPopulate(removePassword, ctx));
        const sanitizeFields = utils.async.pipe(utils.traverse.traverseQueryFields(removeDisallowedFields(permittedFields), ctx), utils.traverse.traverseQueryFields(omitHiddenFields, ctx), utils.traverse.traverseQueryFields(removePassword, ctx));
        return async (query)=>{
            const sanitizedQuery = fp.cloneDeep(query);
            if (query.filters) {
                Object.assign(sanitizedQuery, {
                    filters: await sanitizeFilters(query.filters)
                });
            }
            if (query.sort) {
                Object.assign(sanitizedQuery, {
                    sort: await sanitizeSort(query.sort)
                });
            }
            if (query.populate) {
                Object.assign(sanitizedQuery, {
                    populate: await sanitizePopulate(query.populate)
                });
            }
            if (query.fields) {
                Object.assign(sanitizedQuery, {
                    fields: await sanitizeFields(query.fields)
                });
            }
            return sanitizedQuery;
        };
    };
    const createSanitizeOutput = (options = {})=>{
        const { fields } = options;
        const permittedFields = fields.shouldIncludeAll ? null : getOutputFields(fields.permitted);
        return utils.async.pipe(// Remove fields hidden from the admin
        utils.traverseEntity(omitHiddenFields, ctx), // Remove unallowed fields from admin::user relations
        utils.traverseEntity(pickAllowedAdminUserFields, ctx), // Remove not allowed fields (RBAC)
        utils.traverseEntity(removeDisallowedFields(permittedFields), ctx), // Remove all fields of type 'password'
        utils.sanitize.sanitizers.sanitizePasswords({
            schema,
            getModel (uid) {
                return strapi.getModel(uid);
            }
        }));
    };
    const createSanitizeInput = (options = {})=>{
        const { fields } = options;
        const permittedFields = fields.shouldIncludeAll ? null : getInputFields(fields.permitted);
        return utils.async.pipe(// Remove fields hidden from the admin
        utils.traverseEntity(omitHiddenFields, ctx), // Remove not allowed fields (RBAC)
        utils.traverseEntity(removeDisallowedFields(permittedFields), ctx), // Remove roles from createdBy & updatedBy fields
        omitCreatorRoles);
    };
    const wrapSanitize = (createSanitizeFunction)=>{
        // TODO
        // @ts-expect-error define the correct return type
        const wrappedSanitize = async (data, options = {})=>{
            if (fp.isArray(data)) {
                return Promise.all(data.map((entity)=>wrappedSanitize(entity, options)));
            }
            const { subject, action: actionOverride } = getDefaultOptions(data, options);
            const permittedFields = extra.permittedFieldsOf(ability$1, actionOverride, subject, {
                fieldsFrom: (rule)=>rule.fields || []
            });
            const hasAtLeastOneRegistered = fp.some((fields)=>!fp.isNil(fields), fp.flatMap(fp.prop('fields'), ability$1.rulesFor(actionOverride, ability.detectSubjectType(subject))));
            const shouldIncludeAllFields = fp.isEmpty(permittedFields) && !hasAtLeastOneRegistered;
            const sanitizeOptions = {
                ...options,
                fields: {
                    shouldIncludeAll: shouldIncludeAllFields,
                    permitted: permittedFields,
                    hasAtLeastOneRegistered
                }
            };
            const sanitizeFunction = createSanitizeFunction(sanitizeOptions);
            return sanitizeFunction(data);
        };
        return wrappedSanitize;
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
   */ const omitHiddenFields = ({ key, schema }, { remove })=>{
        const isHidden = fp.getOr(false, [
            'config',
            'attributes',
            key,
            'hidden'
        ], schema);
        if (isHidden) {
            remove(key);
        }
    };
    /**
   * Visitor used to only select needed fields from the admin users entities & avoid leaking sensitive information
   */ const pickAllowedAdminUserFields = ({ attribute, key, value }, { set })=>{
        const pickAllowedFields = fp.pick(user.ADMIN_USER_ALLOWED_FIELDS);
        if (!attribute) {
            return;
        }
        if (attribute.type === 'relation' && attribute.target === 'admin::user' && value) {
            if (Array.isArray(value)) {
                set(key, value.map(pickAllowedFields));
            } else {
                set(key, pickAllowedFields(value));
            }
        }
    };
    /**
   * Visitor used to omit disallowed fields from the admin users entities & avoid leaking sensitive information
   */ const omitDisallowedAdminUserFields = ({ key, attribute, schema }, { remove })=>{
        if (schema.uid === 'admin::user' && attribute && !user.ADMIN_USER_ALLOWED_FIELDS.includes(key)) {
            remove(key);
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
    const getOutputFields = (fields = [])=>{
        const nonWritableAttributes = getNonWritableAttributes(schema);
        const nonVisibleAttributes = getNonVisibleAttributes(schema);
        return fp.uniq([
            ...fields,
            ...STATIC_FIELDS,
            ...COMPONENT_FIELDS,
            ...nonWritableAttributes,
            ...nonVisibleAttributes,
            CREATED_AT_ATTRIBUTE,
            UPDATED_AT_ATTRIBUTE
        ]);
    };
    const getQueryFields = (fields = [])=>{
        const nonVisibleAttributes = getNonVisibleAttributes(schema);
        const writableAttributes = getWritableAttributes(schema);
        const nonVisibleWritableAttributes = fp.intersection(nonVisibleAttributes, writableAttributes);
        return fp.uniq([
            ...fields,
            ...STATIC_FIELDS,
            ...COMPONENT_FIELDS,
            ...nonVisibleWritableAttributes,
            CREATED_AT_ATTRIBUTE,
            UPDATED_AT_ATTRIBUTE,
            PUBLISHED_AT_ATTRIBUTE,
            CREATED_BY_ATTRIBUTE,
            UPDATED_BY_ATTRIBUTE
        ]);
    };
    return {
        sanitizeOutput: wrapSanitize(createSanitizeOutput),
        sanitizeInput: wrapSanitize(createSanitizeInput),
        sanitizeQuery: wrapSanitize(createSanitizeQuery)
    };
});

module.exports = createSanitizeHelpers;
//# sourceMappingURL=sanitize.js.map
