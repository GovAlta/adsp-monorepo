import { createContentApiRoutesFactory } from '@strapi/utils';
import { I18nLocaleRouteValidator } from './validation/locale.mjs';

const createContentApiRoutes = createContentApiRoutesFactory(()=>{
    const validator = new I18nLocaleRouteValidator(strapi);
    return [
        {
            method: 'GET',
            path: '/locales',
            handler: 'locales.listLocales',
            response: validator.locales
        }
    ];
});

export { createContentApiRoutes as default };
//# sourceMappingURL=content-api.mjs.map
