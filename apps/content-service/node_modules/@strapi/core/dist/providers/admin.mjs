import { defineProvider } from './provider.mjs';
import loadAdmin from '../loaders/admin.mjs';

var admin = defineProvider({
    init (strapi) {
        // eslint-disable-next-line node/no-missing-require
        strapi.add('admin', ()=>require('@strapi/admin/strapi-server'));
    },
    async register (strapi) {
        await loadAdmin(strapi);
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

export { admin as default };
//# sourceMappingURL=admin.mjs.map
