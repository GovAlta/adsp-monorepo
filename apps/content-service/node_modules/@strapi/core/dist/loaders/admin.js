'use strict';

var _ = require('lodash');
var index = require('../domain/content-type/index.js');

async function loadAdmin(strapi) {
    strapi.get('services').add(`admin::`, strapi.admin?.services);
    strapi.get('controllers').add(`admin::`, strapi.admin?.controllers);
    strapi.get('content-types').add(`admin::`, formatContentTypes(strapi.admin?.contentTypes ?? {}));
    strapi.get('policies').add(`admin::`, strapi.admin?.policies);
    strapi.get('middlewares').add(`admin::`, strapi.admin?.middlewares);
    const userAdminConfig = strapi.config.get('admin');
    strapi.get('config').set('admin', _.merge(strapi.admin?.config, userAdminConfig));
}
const formatContentTypes = (contentTypes)=>{
    Object.values(contentTypes).forEach((definition)=>{
        const { schema } = definition;
        Object.assign(schema, {
            plugin: 'admin',
            globalId: index.getGlobalId(schema, 'admin')
        });
    });
    return contentTypes;
};

module.exports = loadAdmin;
//# sourceMappingURL=admin.js.map
