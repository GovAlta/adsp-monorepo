'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');

const { ApplicationError } = utils.errors;
// TODO: v5 if implemented in the CM => delete this middleware
const validateLocaleCreation = async (ctx, next)=>{
    const { model } = ctx.params;
    const { query } = ctx.request;
    // Prevent empty body
    if (!ctx.request.body) {
        ctx.request.body = {};
    }
    const body = ctx.request.body;
    const { getValidLocale, isLocalizedContentType } = index.getService('content-types');
    const modelDef = strapi.getModel(model);
    if (!isLocalizedContentType(modelDef)) {
        return next();
    }
    // Prevent empty string locale
    const locale = fp.get('locale', query) || fp.get('locale', body) || undefined;
    // cleanup to avoid creating duplicates in single types
    ctx.request.query = {};
    let entityLocale;
    try {
        entityLocale = await getValidLocale(locale);
    } catch (e) {
        throw new ApplicationError("This locale doesn't exist");
    }
    body.locale = entityLocale;
    if (modelDef.kind === 'singleType') {
        const entity = await strapi.entityService.findMany(modelDef.uid, {
            locale: entityLocale
        }); // TODO: add this type to entityService
        ctx.request.query.locale = body.locale;
        // updating
        if (entity) {
            return next();
        }
    }
    return next();
};

module.exports = validateLocaleCreation;
//# sourceMappingURL=validate-locale-creation.js.map
