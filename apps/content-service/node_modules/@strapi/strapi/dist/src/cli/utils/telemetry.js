'use strict';

var utils = require('@strapi/utils');

const sendEvent = async (event, uuid, installId)=>{
    const analyticsUrl = utils.env('STRAPI_ANALYTICS_URL', 'https://analytics.strapi.io');
    try {
        await fetch(`${analyticsUrl}/api/v2/track`, {
            method: 'POST',
            body: JSON.stringify({
                event,
                deviceId: utils.generateInstallId(uuid, installId),
                groupProperties: {
                    projectId: uuid
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-Strapi-Event': event
            }
        });
    } catch (e) {
    // ...
    }
};

exports.sendEvent = sendEvent;
//# sourceMappingURL=telemetry.js.map
