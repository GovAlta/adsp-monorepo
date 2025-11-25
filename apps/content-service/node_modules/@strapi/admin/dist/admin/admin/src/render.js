'use strict';

var client = require('react-dom/client');
var StrapiApp = require('./StrapiApp.js');
var getFetchClient = require('./utils/getFetchClient.js');
var urls = require('./utils/urls.js');

const renderAdmin = async (mountNode, { plugins, customisations, features })=>{
    if (!mountNode) {
        throw new Error('[@strapi/admin]: Could not find the root element to mount the admin app');
    }
    window.strapi = {
        /**
     * This ENV variable is passed from the strapi instance, by default no url is set
     * in the config and therefore the instance returns you an empty string so URLs are relative.
     *
     * To ensure that the backendURL is always set, we use the window.location.origin as a fallback.
     */ backendURL: urls.createAbsoluteUrl(process.env.STRAPI_ADMIN_BACKEND_URL),
        isEE: false,
        isTrial: false,
        telemetryDisabled: process.env.STRAPI_TELEMETRY_DISABLED === 'true',
        future: {
            isEnabled: (name)=>{
                return features?.future?.[name] === true;
            }
        },
        // @ts-expect-error – there's pollution from the global scope of Node.
        features: {
            SSO: 'sso',
            AUDIT_LOGS: 'audit-logs',
            REVIEW_WORKFLOWS: 'review-workflows',
            /**
       * If we don't get the license then we know it's not EE
       * so no feature is enabled.
       */ isEnabled: ()=>false
        },
        projectType: 'Community',
        flags: {
            nps: false,
            promoteEE: true
        },
        ai: {
            enabled: true
        }
    };
    const { get } = getFetchClient.getFetchClient();
    try {
        const { data: { data: { isEE, isTrial, features, flags, ai } } } = await get('/admin/project-type');
        window.strapi.isEE = isEE;
        window.strapi.isTrialLicense = isTrial;
        window.strapi.flags = flags;
        window.strapi.features = {
            ...window.strapi.features,
            isEnabled: (featureName)=>features.some((feature)=>feature.name === featureName)
        };
        window.strapi.projectType = isEE ? 'Enterprise' : 'Community';
        window.strapi.aiLicenseKey = process.env.STRAPI_ADMIN_AI_API_KEY;
        window.strapi.ai = ai;
    } catch (err) {
        /**
     * If this fails, we simply don't activate any EE features.
     * Should we warn clearer in the UI?
     */ console.error(err);
    }
    const app = new StrapiApp.StrapiApp({
        config: customisations?.config,
        appPlugins: plugins
    });
    await app.register(customisations?.register);
    await app.bootstrap(customisations?.bootstrap);
    await app.loadTrads(customisations?.config?.translations);
    client.createRoot(mountNode).render(app.render());
    if (typeof module !== 'undefined' && module && 'hot' in module && typeof module.hot === 'object' && module.hot !== null && 'accept' in module.hot && typeof module.hot.accept === 'function') {
        module.hot.accept();
    }
    if (typeof undefined?.accept === 'function') {
        undefined.accept();
    }
};

exports.renderAdmin = renderAdmin;
//# sourceMappingURL=render.js.map
