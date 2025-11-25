import { yup, contentTypes, validateYupSchema, errors } from '@strapi/utils';

const singleLocaleSchema = yup.string().nullable();
const multipleLocaleSchema = yup.lazy((value)=>Array.isArray(value) ? yup.array().of(singleLocaleSchema.required()) : singleLocaleSchema);
const statusSchema = yup.mixed().oneOf([
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
    const defaultStatus = contentTypes.hasDraftAndPublish(strapi.getModel(model)) ? undefined : 'published';
    const status = providedStatus !== undefined ? providedStatus : defaultStatus;
    const schema = yup.object().shape({
        locale: allowMultipleLocales ? multipleLocaleSchema : singleLocaleSchema,
        status: statusSchema
    });
    try {
        await validateYupSchema(schema, {
            strict: true,
            abortEarly: false
        })(request);
        return {
            locale,
            status,
            ...rest
        };
    } catch (error) {
        throw new errors.ValidationError(`Validation error: ${error.message}`);
    }
};

export { getDocumentLocaleAndStatus };
//# sourceMappingURL=dimensions.mjs.map
