import { defineProvider } from './provider.mjs';
import { webhookModel, createWebhookStore } from '../services/webhook-store.mjs';
import createWebhookRunner from '../services/webhook-runner.mjs';

var webhooks = defineProvider({
    init (strapi) {
        strapi.get('models').add(webhookModel);
        strapi.add('webhookStore', ()=>createWebhookStore({
                db: strapi.db
            }));
        strapi.add('webhookRunner', ()=>createWebhookRunner({
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

export { webhooks as default };
//# sourceMappingURL=webhooks.mjs.map
