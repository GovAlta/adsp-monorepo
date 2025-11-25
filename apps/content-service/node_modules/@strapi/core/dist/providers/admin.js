'use strict';

var provider = require('./provider.js');
var admin$1 = require('../loaders/admin.js');

var admin = provider.defineProvider({
    init (strapi) {
        // eslint-disable-next-line node/no-missing-require
        strapi.add('admin', ()=>require('@strapi/admin/strapi-server'));
    },
    async register (strapi) {
        await admin$1(strapi);
        await strapi.get('admin')?.register({
            strapi
        });
    },
    async bootstrap (strapi) {
        await strapi.get('admin')?.bootstrap({
            strapi
        });
    },
    async destroy (strapi) {
        await strapi.get('admin')?.destroy({
            strapi
        });
    }
});

module.exports = admin;
//# sourceMappingURL=admin.js.map
