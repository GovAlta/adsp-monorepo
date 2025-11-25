'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');

const sendDidInitializeEvent = async ()=>{
    const { isLocalizedContentType } = index.getService('content-types');
    // TODO: V5: This event should be renamed numberOfContentTypes in V5 as the name is already taken to describe the number of content types using i18n.
    const numberOfContentTypes = fp.reduce((sum, contentType)=>isLocalizedContentType(contentType) ? sum + 1 : sum, 0)(strapi.contentTypes);
    await strapi.telemetry.send('didInitializeI18n', {
        groupProperties: {
            numberOfContentTypes
        }
    });
};
const sendDidUpdateI18nLocalesEvent = async ()=>{
    const numberOfLocales = await index.getService('locales').count();
    await strapi.telemetry.send('didUpdateI18nLocales', {
        groupProperties: {
            numberOfLocales
        }
    });
};
const metrics = ()=>({
        sendDidInitializeEvent,
        sendDidUpdateI18nLocalesEvent
    });

module.exports = metrics;
//# sourceMappingURL=metrics.js.map
