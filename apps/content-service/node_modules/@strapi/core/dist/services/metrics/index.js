'use strict';

var rateLimiter = require('./rate-limiter.js');
var sender = require('./sender.js');
var middleware = require('./middleware.js');
var isTruthy = require('./is-truthy.js');

const LIMITED_EVENTS = [
    'didSaveMediaWithAlternativeText',
    'didSaveMediaWithCaption',
    'didDisableResponsiveDimensions',
    'didEnableResponsiveDimensions',
    'didInitializePluginUpload'
];
const createTelemetryInstance = (strapi)=>{
    const uuid = strapi.config.get('uuid');
    const telemetryDisabled = strapi.config.get('packageJsonStrapi.telemetryDisabled');
    const isDisabled = !uuid || isTruthy(process.env.STRAPI_TELEMETRY_DISABLED) || isTruthy(telemetryDisabled);
    const sender$1 = sender(strapi);
    const sendEvent = rateLimiter(sender$1, {
        limitedEvents: LIMITED_EVENTS
    });
    return {
        get isDisabled () {
            return isDisabled;
        },
        register () {
            if (!isDisabled) {
                strapi.cron.add({
                    sendPingEvent: {
                        task: ()=>sendEvent('ping'),
                        options: '0 0 12 * * *'
                    }
                });
                strapi.server.use(middleware({
                    sendEvent,
                    strapi
                }));
            }
        },
        bootstrap () {},
        async send (event, payload = {}) {
            if (isDisabled) return true;
            return sendEvent(event, payload);
        },
        destroy () {
        // Clean up resources if needed
        }
    };
};

module.exports = createTelemetryInstance;
//# sourceMappingURL=index.js.map
