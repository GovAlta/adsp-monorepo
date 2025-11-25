import { getOr, prop, map, pipe, flatten, uniq, pick } from 'lodash/fp';
import { contentTypes, errors } from '@strapi/utils';
import { getService } from '../utils/index.mjs';
import { validateGetNonLocalizedAttributesInput } from '../validation/content-types.mjs';

const { ApplicationError } = errors;
const { PUBLISHED_AT_ATTRIBUTE } = contentTypes.constants;
const getLocalesProperty = getOr([], 'properties.locales');
const getFieldsProperty = prop('properties.fields');
const getFirstLevelPath = map((path)=>path.split('.')[0]);
const controller = {
    async getNonLocalizedAttributes (ctx) {
        const { user } = ctx.state;
        const body = ctx.request.body;
        const { model, id, locale } = body;
        await validateGetNonLocalizedAttributesInput({
            model,
            id,
            locale
        });
        const { copyNonLocalizedAttributes, isLocalizedContentType, getNestedPopulateOfNonLocalizedAttributes } = getService('content-types');
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
                    id: user.roles.map(prop('id'))
                }
            }
        });
        const localePermissions = permissions.filter((perm)=>getLocalesProperty(perm).includes(locale)).map(getFieldsProperty);
        const permittedFields = pipe(flatten, getFirstLevelPath, uniq)(localePermissions);
        const nonLocalizedFields = copyNonLocalizedAttributes(modelDef, entity);
        const sanitizedNonLocalizedFields = pick(permittedFields, nonLocalizedFields);
        const availableLocalesResult = await strapi.plugins['content-manager'].service('document-metadata').getMetadata(model, entity, {
            availableLocales: true
        });
        const availableLocales = availableLocalesResult.availableLocales.map((localeResult)=>pick([
                'id',
                'locale',
                PUBLISHED_AT_ATTRIBUTE
            ], localeResult));
        ctx.body = {
            nonLocalizedFields: sanitizedNonLocalizedFields,
            localizations: availableLocales.concat(pick([
                'id',
                'locale',
                PUBLISHED_AT_ATTRIBUTE
            ], entity))
        };
    }
};

export { controller as default };
//# sourceMappingURL=content-types.mjs.map
