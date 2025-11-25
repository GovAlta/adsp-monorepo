import { defineProvider } from './provider.mjs';
import createCronService from '../services/cron.mjs';

var cron = defineProvider({
    init (strapi) {
        strapi.add('cron', ()=>createCronService());
    },
    async bootstrap (strapi) {
        if (strapi.config.get('server.cron.enabled', true)) {
            const cronTasks = strapi.config.get('server.cron.tasks', {});
            strapi.get('cron').add(cronTasks);
        }
        strapi.get('cron').start();
    },
    async destroy (strapi) {
        strapi.get('cron').destroy();
    }
});

export { cron as default };
//# sourceMappingURL=cron.mjs.map
