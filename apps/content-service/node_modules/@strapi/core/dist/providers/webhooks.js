'use strict';

var provider = require('./provider.js');
var webhookStore = require('../services/webhook-store.js');
var webhookRunner = require('../services/webhook-runner.js');

var webhooks = provider.defineProvider({
    init (strapi) {
        strapi.get('models').add(webhookStore.webhookModel);
        strapi.add('webhookStore', ()=>webhookStore.createWebhookStore({
                db: strapi.db
            }));
        strapi.add('webhookRunner', ()=>webhookRunner({
                eventHub: strapi.eventHub,
                logger: strapi.log,
                configuration: strapi.config.get('server.webhooks', {}),
                fetch: strapi.fetch
            }));
    },
    async bootstrap (strapi) {
        const webhooks = await strapi.get('webhookStore').findWebhooks();
        if (!webhooks) {
            return;
        }
        for (const webhook of webhooks){
            strapi.get('webhookRunner').add(webhook);
        }
    }
});

module.exports = webhooks;
//# sourceMappingURL=webhooks.js.map
