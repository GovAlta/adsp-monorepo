import { env, generateInstallId } from '@strapi/utils';

const sendEvent = async (event, uuid, installId)=>{
    const analyticsUrl = env('STRAPI_ANALYTICS_URL', 'https://analytics.strapi.io');
    try {
        await fetch(`${analyticsUrl}/api/v2/track`, {
            method: 'POST',
            body: JSON.stringify({
                event,
                deviceId: generateInstallId(uuid, installId),
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

export { sendEvent };
//# sourceMappingURL=telemetry.mjs.map
