'use strict';

var strapiUtils = require('@strapi/utils');

const singleLocaleSchema = strapiUtils.yup.string().nullable();
const multipleLocaleSchema = strapiUtils.yup.lazy((value)=>Array.isArray(value) ? strapiUtils.yup.array().of(singleLocaleSchema.required()) : singleLocaleSchema);
const statusSchema = strapiUtils.yup.mixed().oneOf([
    'draft',
    'published'
], 'Invalid status');
/**
 * From a request or query object, validates and returns the locale and status of the document.
 * If the status is not provided and Draft & Publish is disabled, it defaults to 'published'.
 */ const getDocumentLocaleAndStatus = async (request, model, opts = {
    allowMultipleLocales: false
})=>{
    const { allowMultipleLocales } = opts;
    const { locale, status: providedStatus, ...rest } = request || {};
    const defaultStatus = strapiUtils.contentTypes.hasDraftAndPublish(strapi.getModel(model)) ? undefined : 'published';
    const status = providedStatus !== undefined ? providedStatus : defaultStatus;
    const schema = strapiUtils.yup.object().shape({
        locale: allowMultipleLocales ? multipleLocaleSchema : singleLocaleSchema,
        status: statusSchema
    });
    try {
        await strapiUtils.validateYupSchema(schema, {
            strict: true,
            abortEarly: false
        })(request);
        return {
            locale,
            status,
            ...rest
        };
    } catch (error) {
        throw new strapiUtils.errors.ValidationError(`Validation error: ${error.message}`);
    }
};

exports.getDocumentLocaleAndStatus = getDocumentLocaleAndStatus;
//# sourceMappingURL=dimensions.js.map
