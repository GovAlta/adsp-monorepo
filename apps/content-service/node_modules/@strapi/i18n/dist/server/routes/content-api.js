'use strict';

var utils = require('@strapi/utils');
var locale = require('./validation/locale.js');

const createContentApiRoutes = utils.createContentApiRoutesFactory(()=>{
    const validator = new locale.I18nLocaleRouteValidator(strapi);
    return [
        {
            method: 'GET',
            path: '/locales',
            handler: 'locales.listLocales',
            response: validator.locales
        }
    ];
});

module.exports = createContentApiRoutes;
//# sourceMappingURL=content-api.js.map
