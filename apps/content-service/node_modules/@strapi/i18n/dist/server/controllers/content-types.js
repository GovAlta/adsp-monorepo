'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var contentTypes = require('../validation/content-types.js');

const { ApplicationError } = utils.errors;
const { PUBLISHED_AT_ATTRIBUTE } = utils.contentTypes.constants;
const getLocalesProperty = fp.getOr([], 'properties.locales');
const getFieldsProperty = fp.prop('properties.fields');
const getFirstLevelPath = fp.map((path)=>path.split('.')[0]);
const controller = {
    async getNonLocalizedAttributes (ctx) {
        const { user } = ctx.state;
        const body = ctx.request.body;
        const { model, id, locale } = body;
        await contentTypes.validateGetNonLocalizedAttributesInput({
            model,
            id,
            locale
        });
        const { copyNonLocalizedAttributes, isLocalizedContentType, getNestedPopulateOfNonLocalizedAttributes } = index.getService('content-types');
        const { default: { READ_ACTION, CREATE_ACTION } } = strapi.service('admin::constants');
        const modelDef = strapi.contentType(model);
        const attributesToPopulate = getNestedPopulateOfNonLocalizedAttributes(model);
        if (!isLocalizedContentType(modelDef)) {
            throw new ApplicationError(`Model ${model} is not localized`);
        }
        const params = modelDef.kind === 'singleType' ? {} : {
            id
        };
        const entity = await strapi.db.query(model).findOne({
            where: params,
            populate: attributesToPopulate
        });
        if (!entity) {
            return ctx.notFound();
        }
        const permissions = await strapi.admin.services.permission.findMany({
            where: {
                action: [
                    READ_ACTION,
                    CREATE_ACTION
                ],
                subject: model,
                role: {
                    id: user.roles.map(fp.prop('id'))
                }
            }
        });
        const localePermissions = permissions.filter((perm)=>getLocalesProperty(perm).includes(locale)).map(getFieldsProperty);
        const permittedFields = fp.pipe(fp.flatten, getFirstLevelPath, fp.uniq)(localePermissions);
        const nonLocalizedFields = copyNonLocalizedAttributes(modelDef, entity);
        const sanitizedNonLocalizedFields = fp.pick(permittedFields, nonLocalizedFields);
        const availableLocalesResult = await strapi.plugins['content-manager'].service('document-metadata').getMetadata(model, entity, {
            availableLocales: true
        });
        const availableLocales = availableLocalesResult.availableLocales.map((localeResult)=>fp.pick([
                'id',
                'locale',
                PUBLISHED_AT_ATTRIBUTE
            ], localeResult));
        ctx.body = {
            nonLocalizedFields: sanitizedNonLocalizedFields,
            localizations: availableLocales.concat(fp.pick([
                'id',
                'locale',
                PUBLISHED_AT_ATTRIBUTE
            ], entity))
        };
    }
};

module.exports = controller;
//# sourceMappingURL=content-types.js.map
