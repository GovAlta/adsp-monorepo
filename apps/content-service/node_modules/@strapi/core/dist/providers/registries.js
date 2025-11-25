'use strict';

var strapiUtils = require('@strapi/utils');
var provider = require('./provider.js');
var contentTypes = require('../registries/content-types.js');
var components = require('../registries/components.js');
var services = require('../registries/services.js');
var policies = require('../registries/policies.js');
var middlewares = require('../registries/middlewares.js');
var hooks = require('../registries/hooks.js');
var controllers = require('../registries/controllers.js');
var modules = require('../registries/modules.js');
var plugins = require('../registries/plugins.js');
var customFields = require('../registries/custom-fields.js');
var apis = require('../registries/apis.js');
var sanitizers = require('../registries/sanitizers.js');
var validators = require('../registries/validators.js');
var models = require('../registries/models.js');
var index = require('../loaders/index.js');
var index$1 = require('../migrations/index.js');
var _5_0_0DiscardDrafts = require('../migrations/database/5.0.0-discard-drafts.js');

var registries = provider.defineProvider({
    init (strapi) {
        strapi.add('content-types', ()=>contentTypes()).add('components', ()=>components()).add('services', ()=>services(strapi)).add('policies', ()=>policies()).add('middlewares', ()=>middlewares()).add('hooks', ()=>hooks()).add('controllers', ()=>controllers(strapi)).add('modules', ()=>modules(strapi)).add('plugins', ()=>plugins(strapi)).add('custom-fields', ()=>customFields(strapi)).add('apis', ()=>apis(strapi)).add('models', ()=>models.registry()).add('sanitizers', sanitizers()).add('validators', validators());
    },
    async register (strapi) {
        await index.loadApplicationContext(strapi);
        strapi.get('hooks').set('strapi::content-types.beforeSync', strapiUtils.hooks.createAsyncParallelHook());
        strapi.get('hooks').set('strapi::content-types.afterSync', strapiUtils.hooks.createAsyncParallelHook());
        // Content migration to enable draft and publish
        strapi.hook('strapi::content-types.beforeSync').register(index$1.disable);
        strapi.hook('strapi::content-types.afterSync').register(index$1.enable);
        // Database migrations
        strapi.db.migrations.providers.internal.register(_5_0_0DiscardDrafts.discardDocumentDrafts);
    }
});

module.exports = registries;
//# sourceMappingURL=registries.js.map
