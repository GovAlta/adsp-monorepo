import { getService } from './utils/index.mjs';
import { ALLOWED_WEBHOOK_EVENTS } from './constants/index.mjs';
import history from './history/index.mjs';
import preview from './preview/index.mjs';

var bootstrap = (async ()=>{
    Object.entries(ALLOWED_WEBHOOK_EVENTS).forEach(([key, value])=>{
        strapi.get('webhookStore').addAllowedEvent(key, value);
    });
    getService('field-sizes').setCustomFieldInputSizes();
    await getService('components').syncConfigurations();
    await getService('content-types').syncConfigurations();
    await getService('permission').registerPermissions();
    await history.bootstrap?.({
        strapi
    });
    await preview.bootstrap?.({
        strapi
    });
});

export { bootstrap as default };
//# sourceMappingURL=bootstrap.mjs.map
