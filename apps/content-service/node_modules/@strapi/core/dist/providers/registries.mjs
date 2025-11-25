import { hooks } from '@strapi/utils';
import { defineProvider } from './provider.mjs';
import contentTypesRegistry from '../registries/content-types.mjs';
import componentsRegistry from '../registries/components.mjs';
import servicesRegistry from '../registries/services.mjs';
import policiesRegistry from '../registries/policies.mjs';
import middlewaresRegistry from '../registries/middlewares.mjs';
import hooksRegistry from '../registries/hooks.mjs';
import controllersRegistry from '../registries/controllers.mjs';
import modulesRegistry from '../registries/modules.mjs';
import pluginsRegistry from '../registries/plugins.mjs';
import customFieldsRegistry from '../registries/custom-fields.mjs';
import apisRegistry from '../registries/apis.mjs';
import sanitizersRegistry from '../registries/sanitizers.mjs';
import validatorsRegistry from '../registries/validators.mjs';
import { registry } from '../registries/models.mjs';
import { loadApplicationContext } from '../loaders/index.mjs';
import { disable, enable } from '../migrations/index.mjs';
import { discardDocumentDrafts } from '../migrations/database/5.0.0-discard-drafts.mjs';

var registries = defineProvider({
    init (strapi) {
        strapi.add('content-types', ()=>contentTypesRegistry()).add('components', ()=>componentsRegistry()).add('services', ()=>servicesRegistry(strapi)).add('policies', ()=>policiesRegistry()).add('middlewares', ()=>middlewaresRegistry()).add('hooks', ()=>hooksRegistry()).add('controllers', ()=>controllersRegistry(strapi)).add('modules', ()=>modulesRegistry(strapi)).add('plugins', ()=>pluginsRegistry(strapi)).add('custom-fields', ()=>customFieldsRegistry(strapi)).add('apis', ()=>apisRegistry(strapi)).add('models', ()=>registry()).add('sanitizers', sanitizersRegistry()).add('validators', validatorsRegistry());
    },
    async register (strapi) {
        await loadApplicationContext(strapi);
        strapi.get('hooks').set('strapi::content-types.beforeSync', hooks.createAsyncParallelHook());
        strapi.get('hooks').set('strapi::content-types.afterSync', hooks.createAsyncParallelHook());
        // Content migration to enable draft and publish
        strapi.hook('strapi::content-types.beforeSync').register(disable);
        strapi.hook('strapi::content-types.afterSync').register(enable);
        // Database migrations
        strapi.db.migrations.providers.internal.register(discardDocumentDrafts);
    }
});

export { registries as default };
//# sourceMappingURL=registries.mjs.map
