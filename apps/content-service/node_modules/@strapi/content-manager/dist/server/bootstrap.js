'use strict';

var index$1 = require('./utils/index.js');
var index = require('./constants/index.js');
var index$2 = require('./history/index.js');
var index$3 = require('./preview/index.js');

var bootstrap = (async ()=>{
    Object.entries(index.ALLOWED_WEBHOOK_EVENTS).forEach(([key, value])=>{
        strapi.get('webhookStore').addAllowedEvent(key, value);
    });
    index$1.getService('field-sizes').setCustomFieldInputSizes();
    await index$1.getService('components').syncConfigurations();
    await index$1.getService('content-types').syncConfigurations();
    await index$1.getService('permission').registerPermissions();
    await index$2.bootstrap?.({
        strapi
    });
    await index$3.bootstrap?.({
        strapi
    });
});

module.exports = bootstrap;
//# sourceMappingURL=bootstrap.js.map
