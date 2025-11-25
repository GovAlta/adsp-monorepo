import * as utils from '@strapi/utils';
import { pick } from 'lodash/fp';
import { getService } from '../utils/index.mjs';
import { validateCreateLocaleInput, validateUpdateLocaleInput } from '../validation/locales.mjs';
import { formatLocale } from '../domain/locale.mjs';

const { setCreatorFields } = utils;
const { ApplicationError } = utils.errors;
const sanitizeLocale = (locale)=>{
    const model = strapi.getModel('plugin::i18n.locale');
    return strapi.contentAPI.sanitize.output(locale, model);
};
const controller = {
    async listLocales (ctx) {
        const localesService = getService('locales');
        const locales = await localesService.find();
        const sanitizedLocales = await sanitizeLocale(locales);
        ctx.body = await localesService.setIsDefault(sanitizedLocales);
    },
    async createLocale (ctx) {
        const { user } = ctx.state;
        const body = ctx.request.body;
        const { isDefault, ...localeToCreate } = body;
        await validateCreateLocaleInput(body);
        const localesService = getService('locales');
        const existingLocale = await localesService.findByCode(body.code);
        if (existingLocale) {
            throw new ApplicationError('This locale already exists');
        }
        const localeToPersist = setCreatorFields({
            user
        })(formatLocale(localeToCreate));
        const locale = await localesService.create(localeToPersist);
        if (isDefault) {
            await localesService.setDefaultLocale(locale);
        }
        const sanitizedLocale = await sanitizeLocale(locale);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    },
    async updateLocale (ctx) {
        const { user } = ctx.state;
        const { id } = ctx.params;
        const body = ctx.request.body;
        const { isDefault, ...updates } = body;
        await validateUpdateLocaleInput(body);
        const localesService = getService('locales');
        const existingLocale = await localesService.findById(id);
        if (!existingLocale) {
            return ctx.notFound('locale.notFound');
        }
        const allowedParams = [
            'name'
        ];
        const cleanUpdates = setCreatorFields({
            user,
            isEdition: true
        })(pick(allowedParams, updates));
        const updatedLocale = await localesService.update({
            id
        }, cleanUpdates);
        if (isDefault) {
            await localesService.setDefaultLocale(updatedLocale);
        }
        const sanitizedLocale = await sanitizeLocale(updatedLocale);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    },
    async deleteLocale (ctx) {
        const { id } = ctx.params;
        const localesService = getService('locales');
        const existingLocale = await localesService.findById(id);
        if (!existingLocale) {
            return ctx.notFound('locale.notFound');
        }
        const defaultLocaleCode = await localesService.getDefaultLocale();
        if (existingLocale.code === defaultLocaleCode) {
            throw new ApplicationError('Cannot delete the default locale');
        }
        await localesService.delete({
            id
        });
        const sanitizedLocale = await sanitizeLocale(existingLocale);
        ctx.body = await localesService.setIsDefault(sanitizedLocale);
    }
};

export { controller as default };
//# sourceMappingURL=locales.mjs.map
